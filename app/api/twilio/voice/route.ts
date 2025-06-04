// app/api/twilio/voice/route.ts
import { NextResponse } from "next/server"
import twilio from "twilio"
import { sayElevenLabs } from "@/lib/elevenlabs"

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * Twilioが通話開始時にアクセスしてくるURL
 * → TWiML (XML) を返す
 */
export async function GET() {
  return voiceResponse()
}

export async function POST(request: Request) {
  return voiceResponse()
}

// 実際の処理をまとめる
function voiceResponse() {
  try {
    const response = new VoiceResponse()
    
    // 1. アプリが初めの挨拶をする
    sayElevenLabs(response, "お世話になります。わたくしＡＩコールシステムの安達といいますが、")

    // 2. ユーザーの入力を待つ
    response.gather({
      input: ["speech"],
      language: "ja-JP",
      speechTimeout: "auto",
      action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=initial`,
      method: "POST",
      timeout: 5
    })

    const twiml = response.toString()
    console.log("Generated TwiML:", twiml)

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    })
  } catch (error) {
    console.error("Error generating TwiML:", error)
    return new NextResponse("", {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
