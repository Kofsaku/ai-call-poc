// app/api/twilio/voice/response/route.ts の例
import { NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

// ChatGPTのAPIを呼び出す関数
async function getChatGPTResponse(userInput: string, conversationHistory: string[] = []) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "あなたは親切なアシスタントです。簡潔に、かつ丁寧に応答してください。"
          },
          ...conversationHistory.map(msg => ({
            role: msg.startsWith("ユーザー: ") ? "user" : "assistant",
            content: msg.replace(/^(ユーザー: |アシスタント: )/, "")
          })),
          {
            role: "user",
            content: userInput
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("ChatGPT API error:", error)
    return "申し訳ありません。エラーが発生しました。"
  }
}

export async function POST(request: Request) {
  try {
    console.log("=== リクエスト受信 ===")
    console.log("URL:", request.url)
    console.log("Method:", request.method)

    // リクエストヘッダーの確認
    const headers = Object.fromEntries(request.headers.entries())
    console.log("Headers:", JSON.stringify(headers, null, 2))

    // Twilioから送られる音声入力（SpeechResult）を取得
    const formData = await request.formData()
    console.log("=== FormData 内容 ===")
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`)
    }

    const speechResult = formData.get("SpeechResult")
    const confidence = formData.get("Confidence")
    const isFinal = formData.get("IsFinal")
    const callSid = formData.get("CallSid")
    const timestamp = new Date().toISOString()

    // URLからクエリパラメータの`step`を取得
    const { searchParams } = new URL(request.url)
    const step = searchParams.get("step") || "1"

    // 詳細なログ出力
    console.log("=== 通話情報 ===")
    console.log(`通話ID: ${callSid}`)
    console.log(`タイムスタンプ: ${timestamp}`)
    console.log(`ステップ: ${step}`)
    console.log("=== 音声認識結果 ===")
    console.log(`認識テキスト: ${speechResult}`)
    console.log(`信頼度: ${confidence}`)
    console.log(`確定状態: ${isFinal}`)

    const response = new VoiceResponse()

    if (step === "1") {
      // ユーザーの話した内容に基づいて応答を変える
      let reply = "こんにちは。お手伝いできることはありますか？"
      if (speechResult) {
        const userText = speechResult.toString()
        console.log("=== ユーザー入力 ===")
        console.log(`ユーザー: ${userText}`)

        // さようならで終了
        if (userText.includes("さようなら")) {
          reply = "さようなら。ご利用ありがとうございました。"
          console.log("=== 通話終了 ===")
          console.log(`アプリ: ${reply}`)
          response.hangup()
          return new NextResponse(response.toString(), {
            headers: { "Content-Type": "text/xml; charset=utf-8" },
          })
        }

        // ChatGPTで応答を生成
        const chatGPTResponse = await getChatGPTResponse(userText)
        reply = chatGPTResponse
      }

      console.log("=== アプリ応答 ===")
      console.log(`アプリ: ${reply}`)

      response.say({
        voice: "Polly.Mizuki",
        language: "ja-JP"
      }, reply)

      response.gather({
        input: ["speech"],
        language: "ja-JP",
        speechTimeout: "auto",
        action: `${process.env.NGROK_URL}/api/twilio/voice/response?step=1`,
        method: "POST",
        timeout: 5
      })

    } else if (step === "2") {
      // 2回目のアクセス →「さようなら」で切断
      const goodbyeMessage = "さようなら。ご利用ありがとうございました。"
      console.log("=== 通話終了 ===")
      console.log(`アプリ: ${goodbyeMessage}`)
      response.say({
        voice: "Polly.Mizuki",
        language: "ja-JP"
      }, goodbyeMessage)
      response.hangup()
    }

    const twiml = response.toString()
    console.log("=== 生成されたTwiML ===")
    console.log(twiml)
    console.log("=====================")

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("=== エラー発生 ===")
    console.error("Error generating TwiML:", error)
    if (error instanceof Error) {
      console.error("Error stack:", error.stack)
    }
    return new NextResponse("", {
      status: 204,
      headers: { "Content-Type": "text/xml" },
    })
  }
}
