---
title: "MOSS-TTS-Nano: Real-Time TTS on CPU, No API Bill Required"
date: "2026-04-16"
excerpt: "A 0.1B parameter TTS model that runs on CPU and produces real-time speech. Here's how to wire it into a Next.js/Supabase stack without touching a GPU or a third-party API."
tags: ["TTS", "Python", "Next.js", "Self-Hosted", "AI"]
coverEmoji: "🔊"
auto_generated: true
source_url: "https://github.com/OpenMOSS/MOSS-TTS-Nano"
---

Every TTS integration I've shipped has had the same hidden cost: either you're paying ElevenLabs/OpenAI per character (which adds up fast once users actually use the thing), or you're provisioning a GPU instance that idles at $200/month. MOSS-TTS-Nano changes that calculus. It's a 0.1B parameter multilingual speech model from the OpenMOSS/MOSI.AI team that runs in real-time on plain CPU. 1,200+ stars in its first week tells you other developers noticed the same thing I did.

## What It Actually Is

MOSS-TTS-Nano is a tiny autoregressive speech synthesis model — 0.1B parameters, CPU-only inference, multilingual. The architecture is lean enough that you can run it on the same $5/month VPS that hosts your API. The model weights are on Hugging Face (`OpenMOSS-Team/MOSS-TTS-Nano`), there's a finetuning pipeline if you need a custom voice, and the repo ships with a FastAPI-friendly inference interface.

Installation is straightforward:

```bash
git clone https://github.com/OpenMOSS/MOSS-TTS-Nano
cd MOSS-TTS-Nano
pip install -r requirements.txt
```

Basic inference:

```python
from moss_tts import MossTTS

tts = MossTTS.from_pretrained("OpenMOSS-Team/MOSS-TTS-Nano")
audio = tts.synthesize("G'day, this is running on CPU.")
audio.save("output.wav")
```

That's it. No CUDA, no driver hell, no cloud key rotation.

## Wrapping It as a Microservice

The practical move is a small FastAPI service that your Next.js app hits via an internal endpoint. Keep it separate from your main API so you can scale or swap it independently.

```python
# tts_service.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from moss_tts import MossTTS
import io

app = FastAPI()
model = MossTTS.from_pretrained("OpenMOSS-Team/MOSS-TTS-Nano")

@app.post("/synthesize")
async def synthesize(payload: dict):
    text = payload.get("text", "")
    audio = model.synthesize(text)
    buf = io.BytesIO()
    audio.save(buf, format="wav")
    buf.seek(0)
    return StreamingResponse(buf, media_type="audio/wav")
```

Run it with `uvicorn tts_service:app --host 0.0.0.0 --port 8001` and you've got a self-contained TTS endpoint.

## Wiring It Into Next.js + Supabase

On the Next.js side, create an API route that proxies to your TTS service and optionally caches the audio in Supabase Storage. Caching matters — if you're synthesising the same article summaries or product descriptions repeatedly, don't hit the model twice.

```typescript
// app/api/tts/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  const cacheKey = `tts/${Buffer.from(text).toString('base64').slice(0, 40)}.wav`

  // Check cache first
  const { data: existing } = await supabase.storage
    .from('audio-cache')
    .createSignedUrl(cacheKey, 3600)

  if (existing?.signedUrl) {
    return NextResponse.json({ url: existing.signedUrl })
  }

  // Generate via TTS microservice
  const ttsRes = await fetch('http://localhost:8001/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  const audioBuffer = await ttsRes.arrayBuffer()

  // Cache in Supabase Storage
  await supabase.storage
    .from('audio-cache')
    .upload(cacheKey, audioBuffer, { contentType: 'audio/wav' })

  const { data: signed } = await supabase.storage
    .from('audio-cache')
    .createSignedUrl(cacheKey, 3600)

  return NextResponse.json({ url: signed?.signedUrl })
}
```

Front-end consumption is then just fetching `/api/tts` and feeding the signed URL into an `<audio>` element or the Web Audio API. The first request for any given text hits the model; every subsequent request serves from Supabase Storage. Your CPU load stays reasonable and your storage costs are negligible.

## What I'd Build With This

**1. Read-aloud for a content platform.** Blog post or documentation site on Next.js — add a play button to every article that synthesises on first request and caches the audio. Zero ongoing API cost regardless of traffic volume.

**2. Voice notifications in a Supabase-backed SaaS.** Trigger TTS synthesis in a Supabase Edge Function when certain DB events fire (new order, alert threshold hit), push the audio URL to a user's notification feed. Useful for accessibility and eyes-free workflows.

**3. Custom-voice product demos.** Use the finetuning pipeline to train a brand voice on ~1 hour of recorded audio, deploy the fine-tuned weights on a $20/month VPS, and serve consistent branded TTS across your entire app. No ongoing per-character cost, voice stays yours.

The timing here is right. CPUs have gotten fast enough that 0.1B models run comfortably without hardware acceleration, and the self-hosting story for ML inference has finally matured to the point where a solo developer can run this without an ops team. If you've been putting off adding voice to your app because of API costs or infrastructure complexity, MOSS-TTS-Nano is the model that removes both excuses.
