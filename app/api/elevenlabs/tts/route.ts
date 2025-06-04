import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get("text")
  if (!text) {
    return new NextResponse("text query parameter is required", { status: 400 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  if (!apiKey || !voiceId) {
    console.error("ElevenLabs API key or voice ID not set")
    return new NextResponse("ElevenLabs configuration missing", { status: 500 })
  }

  const elevenResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  )

  if (!elevenResponse.ok) {
    console.error("ElevenLabs API error", await elevenResponse.text())
    return new NextResponse("Failed to generate speech", { status: 500 })
  }

  const audioData = await elevenResponse.arrayBuffer()
  return new NextResponse(Buffer.from(audioData), {
    headers: { "Content-Type": "audio/mpeg" }
  })
}
