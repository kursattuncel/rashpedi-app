import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed!'));
    cb(null, true);
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const JSON_SCHEMA = {
  type: "object",
  properties: {
    labels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          match: { type: "number" }
        },
        required: ["name", "match"]
      }
    },
    top: { type: "string" },
    confidence: { type: "number" },
    red_flags: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" }
  },
  required: ["labels", "top", "confidence", "red_flags", "disclaimer"]
};

const SYSTEM_PROMPT = `
Role: You are a pediatric exanthem IMAGE triage assistant. You must look ONLY at the uploaded image(s) and produce a SINGLE JSON object scoring how well the rash matches a LIMITED set of diseases.

Behavior & Scope
- Use visual evidence ONLY. Ignore free-text symptom descriptions beyond minimal metadata.
- DO NOT provide treatment, medical advice, or a diagnosis. This is a visual suitability score, not a diagnosis.
- You are restricted to the following labels and MUST NOT output anything else:
  allowed_labels = [
    "measles",
    "rubella",
    "fifth_disease",
    "roseola",
    "varicella",
    "hfmd",
    "diaper_rash",
    "tinea",
    "atopic_dermatitis"
  ]

Inputs
- At least one image is required.
- Optional: patient_context (e.g., age_months, fever_present, rash_duration_days).
- Optional: diseases from the user. If provided, score ONLY over allowed_labels ∩ diseases.
- If no diseases list is provided, score over ALL allowed_labels.

Output Format (STRICT: return ONLY one JSON object; no code fences, no extra text/emojis/markdown):
{
  "labels": [
    { "name": "<one_of_allowed_labels>", "match": 0.0 }
  ],
  "top": "<one_of_scored_labels>",
  "confidence": 0.0,
  "red_flags": [ "string", ... ],
  "disclaimer": "This output is not a medical diagnosis or treatment advice. No patient images are stored by this system; only anonymized metadata may be retained."
}

Error Handling
- If there is no image OR the set of labels to score is empty (allowed_labels ∩ diseases = ∅), return:
  {"error":"missing_image_or_labels"}

Scoring Rules
- Produce an independent match score ∈ [0,1] for each scored label; scores need NOT sum to 1.
- If nothing fits well, keep scores low but still select a single highest-scoring label as top and copy its score to confidence.
- NEVER output labels outside allowed_labels.

Red-Flag Heuristics (visual only; keep items brief if present)
- Non-blanching rash / purpura / petechiae
- Meningeal signs or toxic appearance
- Respiratory distress or signs of dehydration
- Very extensive vesicles/ulcers with poor general condition

Privacy & Safety
- Always include the exact disclaimer text above.
- Output MUST be exactly one valid JSON object and nothing else.
`;

// Retry helper with simple backoff
async function callWithRetries(fn, { maxAttempts = 4, base = 400, maxDelay = 4000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      const status = err?.status || err?.response?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable || attempt === maxAttempts) break;
      const delay = Math.min(maxDelay, base * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// --- Debug endpoint (no cost) ---
function maskKey(k='') { if (!k) return null; return k.slice(0,7) + '...' + k.slice(-4); }
app.get('/api/debug', (_req, res) => {
  const key = process.env.GEMINI_API_KEY || '';
  res.json({ ok: true, server: 'up', key_present: Boolean(key), key_masked: key ? maskKey(key) : null, cwd: process.cwd() });
});

// --- Ping (tiny JSON test) ---
app.post('/api/ping', async (_req, res) => {
  const schema = {
  type: "object",
  properties: { pong: { type: "boolean" } },
  required: ["pong"]
};
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: "Return ONLY the JSON: {\"pong\": true}",
      generationConfig: { responseMimeType: "application/json", responseSchema: schema }
    });
    const result = await callWithRetries(() => model.generateContent({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }));
    const text = result?.response?.text?.() || "";
    let parsed = null; try { parsed = JSON.parse(text); } catch {}
    res.json({ ok: true, parsed, raw: text || null });
  } catch (err) {
    const status = err?.status || 500;
    res.status(status).json({ ok: false, status, detail: err?.message || String(err) });
  }
});

// --- Analyze image ---
app.post('/api/analyze', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'missing_image_or_labels' });

    let diseases = [];
    if (typeof req.body.diseases === 'string' && req.body.diseases.trim().length) {
      diseases = req.body.diseases.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(req.body.diseases)) {
      diseases = req.body.diseases.map(s => String(s).trim()).filter(Boolean);
    }

    const b64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: "application/json", responseSchema: JSON_SCHEMA }
    });

    const parts = [
      { text: JSON.stringify({ diseases }) },
      { inlineData: { data: b64, mimeType: mime } }
    ];

    const result = await callWithRetries(() => model.generateContent({ contents: [{ role: "user", parts }] }));
    const text = result?.response?.text?.() || "";

    res.setHeader('Content-Type', 'application/json');
    try {
      const parsed = JSON.parse(text);
      res.send(JSON.stringify(parsed));
    } catch {
      res.send(text || JSON.stringify({ error: 'empty_response' }));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', detail: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Grandma Rash App (Gemini) at http://localhost:${PORT}`));
