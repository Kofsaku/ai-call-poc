// app/api/twilio/voice/route.ts
import { NextResponse } from "next/server"
import twilio from "twilio"

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
    
    // 1. アプリが「こんにちは」という
    response.say({
      voice: "Polly.Mizuki",
      language: "ja-JP"
    }, "こんにちは")

    // 2. ユーザーの入力を待つ
    response.gather({
      input: ["speech"],
      language: "ja-JP",
      speechTimeout: "auto",
      action: `${process.env.NGROK_URL}/api/twilio/voice/response?step=1`,
      method: "POST",
      timeout: 5,
      finishOnKey: "#"
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
      status: 204,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
