# Grandma’s Rash Advice — Gemini API Edition (latest)

A tiny Node.js app that accepts a child rash photo, calls **Gemini (1.5)** with **structured JSON output**, and visualizes the scores.

> **Disclaimer:** This output is **not** a medical diagnosis or treatment advice. **No patient images are stored** by this system; only anonymized metadata may be retained.  
> If any **red flags** are returned, please **contact your doctor or seek urgent care immediately.**

## Quick start

```bash
unzip grandma-rash-app-gemini-latest.zip -d app && cd app/grandma-rash-app
cp .env.example .env
# put your GEMINI_API_KEY from https://ai.google.dev/
npm install
npm start
# open http://localhost:3000
```

### Environment
- `GEMINI_API_KEY` – your Gemini key (AI Studio).
- `GEMINI_MODEL` – optional (default `gemini-1.5-flash`).
- `PORT` – optional, default 3000.
