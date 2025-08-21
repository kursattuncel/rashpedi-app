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
    triage_level: { type: "string", enum: ["Green", "Yellow", "Yellow/Red", "Red"] },
    red_flags: { type: "array", items: { type: "string" } },
    image_quality_warning: { type: "string" },
    disclaimer: { type: "string" }
  },
  required: ["labels", "top", "confidence", "triage_level", "red_flags", "disclaimer"]
};

const SYSTEM_PROMPT = `
Role: You are a pediatric exanthem IMAGE triage assistant. You must look ONLY at the uploaded image(s) and produce a SINGLE JSON object scoring how well the rash matches a LIMITED set of diseases.

Behavior & Scope
- Use visual evidence ONLY. You may also consider provided patient context (age, sex, temperature, fever status, rash distribution, medication history, vaccination status, general condition, symptoms) to inform your analysis.
- DO NOT provide treatment, medical advice, or a diagnosis. This is a visual suitability score, not a diagnosis.
- You are restricted to the following labels and MUST NOT output anything else:
  allowed_labels = [
    "diaper_dermatitis",     // L22 - Green triage
    "atopic_dermatitis",     // L20.9 - Green triage  
    "viral_rash",            // R21 - Yellow triage
    "urticaria",             // L50.9 - Yellow triage
    "drug_eruption",         // L27.0 - Yellow/Red triage
    "varicella",             // B01 - Red triage (Chickenpox)
    "measles",               // B05 - Red triage
    "rubella",               // B06 - Yellow triage (German measles)
    "fifth_disease",         // B08.3 - Yellow triage (Parvovirus B19)
    "roseola",               // B08.2 - Yellow triage (Sixth disease/Roseola infantum)
    "hfmd",                  // B08.4 - Yellow triage (Hand-Foot-Mouth Disease)
    "impetigo",              // L01.0 - Yellow triage
    "cellulitis",            // L03 - Yellow triage
    "meningococcemia"        // A39.2 - Red triage (petechiae/purpura)
  ]

Inputs
- At least one image is required.
- Optional: patient_context (e.g., age_months, biological_sex, temperature_celsius, fever_present, rash_distribution, recent_medication, antibiotic_use, vaccination_status, general_condition, accompanying_symptoms).
- Optional: diseases from the user. If provided, score ONLY over allowed_labels ∩ diseases.
- If no diseases list is provided, score over ALL allowed_labels.

Patient Context Considerations:
- Age patterns: 
  * roseola typically affects 6-24 months with high fever then rash
  * fifth_disease common in school-age children (slapped cheek appearance)
  * varicella more common in unvaccinated children
  * diaper_dermatitis affects infants in diaper area
  * atopic_dermatitis often starts in infancy, flexural areas
- Fever patterns: 
  * roseola: high fever (39-40°C) for 3-4 days, then rash as fever breaks
  * measles: fever with rash, Koplik spots
  * varicella: mild fever with vesicular rash in crops
  * cellulitis: may have fever with spreading erythema
- Rash distribution: 
  * measles: starts face, spreads cephalocaudally
  * varicella: appears in crops, different stages simultaneously
  * fifth_disease: slapped cheek, then lacy body rash
  * hfmd: vesicles on hands, feet, mouth
  * impetigo: honey-crusted lesions, often face
  * cellulitis: spreading erythema, often unilateral
  * diaper_dermatitis: confined to diaper area
- Medication history: 
  * drug_eruption: recent antibiotic use (especially amoxicillin)
  * antibiotic timing important for drug reactions
- Vaccination status: 
  * measles/varicella very unlikely if fully vaccinated
  * breakthrough infections possible but milder
- General condition: 
  * meningococcemia: toxic appearance, rapid progression
  * cellulitis: may affect mobility if on extremity
  * viral conditions: usually well-appearing
- Accompanying symptoms:
  * measles: respiratory symptoms, conjunctivitis
  * hfmd: mouth sores, difficulty eating
  * impetigo: usually no systemic symptoms
  * meningococcemia: may have neck stiffness, altered consciousness

Triage Classifications:
- GREEN (Low risk): diaper_dermatitis, atopic_dermatitis
- YELLOW (Moderate): viral_rash, urticaria, rubella, fifth_disease, roseola, hfmd, impetigo, cellulitis  
- YELLOW/RED (High): drug_eruption
- RED (Emergency): varicella, measles, meningococcemia

Output Format (STRICT: return ONLY one JSON object; no code fences, no extra text/emojis/markdown):
{
  "labels": [
    { "name": "<one_of_allowed_labels>", "match": 0.0 }
  ],
  "top": "<one_of_scored_labels>",
  "confidence": 0.0,
  "triage_level": "<Green|Yellow|Yellow/Red|Red>",
  "red_flags": [ "string", ... ],
  "image_quality_warning": "string or null",
  "disclaimer": "This output is not a medical diagnosis or treatment advice. No patient images are stored by this system; only anonymized metadata may be retained."
}

Error Handling
- If there is no image OR the set of labels to score is empty (allowed_labels ∩ diseases = ∅), return:
  {"error":"missing_image_or_labels"}

Scoring Rules
- Produce an independent match score ∈ [0,1] for each scored label; scores need NOT sum to 1.
- Consider both visual features AND patient context when scoring.
- If nothing fits well, keep scores low but still select a single highest-scoring label as top and copy its score to confidence.
- Set triage_level based on the top-scoring condition's triage classification.
- NEVER output labels outside allowed_labels.

Image Quality Assessment
- If the image is blurry, poorly lit, too dark, or of insufficient quality for proper assessment, set image_quality_warning to: "Image quality is low/blurry - assessment may be less accurate"
- Otherwise set image_quality_warning to null

Red-Flag Heuristics (visual and clinical; keep items brief if present)
- Non-blanching rash / purpura / petechiae (suggests meningococcemia)
- Toxic appearance or altered consciousness
- Rapid spreading erythema (cellulitis concern)
- Extensive vesicles with poor general condition
- High fever (>40°C) with concerning rash pattern
- Difficulty breathing or severe respiratory symptoms
- Severe lethargy or difficulty waking up
- Signs of dehydration or shock

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

// Validate patient context
function validatePatientContext(context) {
  const errors = [];
  
  if (context.age_months !== undefined) {
    const age = Number(context.age_months);
    if (isNaN(age) || age < 0 || age > 216) { // 0-18 years
      errors.push('age_months must be between 0-216');
    }
  }
  
  if (context.biological_sex !== undefined) {
    if (!['M', 'F'].includes(context.biological_sex)) {
      errors.push('biological_sex must be M or F');
    }
  }
  
  if (context.temperature_celsius !== undefined) {
    const temp = Number(context.temperature_celsius);
    if (isNaN(temp) || temp < 32 || temp > 45) {
      errors.push('temperature_celsius must be between 32-45');
    }
  }
  
  if (context.fever_present !== undefined) {
    if (typeof context.fever_present !== 'boolean') {
      errors.push('fever_present must be boolean');
    }
  }
  
  return errors;
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

    // Parse and validate patient context
    let patientContext = {};
    if (req.body.patient_context) {
      try {
        patientContext = JSON.parse(req.body.patient_context);
        const validationErrors = validatePatientContext(patientContext);
        if (validationErrors.length > 0) {
          return res.status(400).json({ 
            error: 'invalid_patient_context', 
            details: validationErrors 
          });
        }
      } catch (err) {
        return res.status(400).json({ 
          error: 'invalid_patient_context_json',
          detail: err.message 
        });
      }
    }

    const b64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: "application/json", responseSchema: JSON_SCHEMA }
    });

    // Prepare context for AI
    const contextData = {
      diseases,
      patient_context: patientContext
    };

    const parts = [
      { text: JSON.stringify(contextData) },
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