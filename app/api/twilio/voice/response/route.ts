// app/api/twilio/voice/response/route.ts の例
import { NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

// 会話履歴を保存するためのメモリ内ストレージ（本番環境では永続化ストレージを使用すべき）
const conversationHistoryStore = new Map<string, string[]>();

// ChatGPTのAPIを呼び出す関数
async function getChatGPTResponse(userInput: string, callSid: string, step: string) {
  try {
    // 会話履歴を取得または初期化
    const conversationHistory = conversationHistoryStore.get(callSid) || [];
    
    // ユーザー入力を履歴に追加
    conversationHistory.push(`ユーザー: ${userInput}`);
    
    // ステップに応じたシステムプロンプトを設定
    let systemPrompt = "あなたは合同会社AIコールの営業担当です。AI関連のサービスを販売する電話営業をしています。顧客側の担当者につなげることが目的です。";
    
    switch(step) {
      case "1":
        systemPrompt += "初めての会話です。相手の反応を踏まえて、担当者につなぐよう促してください。担当者がいない場合は、いつなら都合が良いか聞いてください。";
        break;
      case "2":
        systemPrompt += "2回目の会話です。製品概要を簡潔に伝え、担当者に詳しい説明をしたいことを伝えてください。";
        break;
      case "3":
        systemPrompt += "最後の会話です。担当者につなぐ前に、なぜこのサービスがお客様の会社に有益かを簡潔に伝え、担当者に取り次ぐことを明確に伝えてください。";
        break;
    }
    
    // ステップ3では、担当者に繋ぐ意図を明確にする
    if (step === "3") {
      systemPrompt += "必ず「それでは、弊社の担当者におつなぎしますので、少々お待ちください。」という文で終わらせてください。";
    }

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
            content: systemPrompt
          },
          ...conversationHistory.map(msg => ({
            role: msg.startsWith("ユーザー: ") ? "user" : "assistant",
            content: msg.replace(/^(ユーザー: |アシスタント: )/, "")
          })),
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content;
    
    // AIの応答を履歴に追加
    conversationHistory.push(`アシスタント: ${aiResponse}`);
    
    // 更新された履歴を保存
    conversationHistoryStore.set(callSid, conversationHistory);
    
    return aiResponse;
  } catch (error) {
    console.error("ChatGPT API error:", error)
    return "申し訳ありません。エラーが発生しました。少々お待ちください。"
  }
}

// 次のステップを計算する関数
function getNextStep(currentStep: string): string {
  const step = parseInt(currentStep);
  return (step < 3) ? (step + 1).toString() : "operator";
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
    const callSid = formData.get("CallSid")?.toString() || "unknown-call"
    const timestamp = new Date().toISOString()

    // URLからクエリパラメータの`step`を取得
    const { searchParams } = new URL(request.url)
    const step = searchParams.get("step") || "1"
    const nextStep = getNextStep(step)

    // 詳細なログ出力
    console.log("=== 通話情報 ===")
    console.log(`通話ID: ${callSid}`)
    console.log(`タイムスタンプ: ${timestamp}`)
    console.log(`現在のステップ: ${step}`)
    console.log(`次のステップ: ${nextStep}`)
    console.log("=== 音声認識結果 ===")
    console.log(`認識テキスト: ${speechResult}`)
    console.log(`信頼度: ${confidence}`)

    const response = new VoiceResponse()

    // オペレーターに接続するステップの場合
    if (step === "operator") {
      response.say({
        voice: "Polly.Mizuki",
        language: "ja-JP"
      }, "担当者におつなぎしています。少々お待ちください。")
      
      // オペレーター接続APIを呼び出す
      response.redirect({
        method: "POST"
      }, `${process.env.NGROK_URL}/api/twilio/voice/connect/operator`)
      
      const twiml = response.toString()
      console.log("=== 生成されたTwiML (オペレーター接続) ===")
      console.log(twiml)
      
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      })
    }

    // 通常の会話ステップ
    let reply = ""
    
    // 初めての会話で無音声入力の場合は初期フォールバック
    if (step === "1" && !speechResult) {
      reply = "ご担当者様、いらっしゃいますでしょうか？AIを活用した業務効率化サービスについてご案内したいのですが。"
    } 
    // 音声入力がある場合はChatGPTで応答を生成
    else if (speechResult) {
      const userText = speechResult.toString()
      console.log("=== ユーザー入力 ===")
      console.log(`ユーザー: ${userText}`)

      // さようならで終了
      if (userText.includes("さようなら") || userText.includes("切る") || userText.includes("結構です") || userText.includes("いりません")) {
        reply = "お忙しいところ失礼いたしました。またの機会にご連絡させていただきます。失礼いたします。"
        console.log("=== 通話終了 ===")
        console.log(`アプリ: ${reply}`)
        response.say({
          voice: "Polly.Mizuki",
          language: "ja-JP"
        }, reply)
        response.hangup()
        return new NextResponse(response.toString(), {
          headers: { "Content-Type": "text/xml; charset=utf-8" },
        })
      }

      // ChatGPTで応答を生成
      reply = await getChatGPTResponse(userText, callSid, step)
    } else {
      // 無音声入力でステップ1以外の場合
      reply = "申し訳ありません、お声が聞こえませんでした。もう一度お願いできますでしょうか？"
    }

    console.log("=== アプリ応答 ===")
    console.log(`アプリ: ${reply}`)

    response.say({
      voice: "Polly.Mizuki",
      language: "ja-JP"
    }, reply)

    // ステップ3の場合は次のステップでオペレーターに接続
    if (step === "3") {
      response.redirect({
        method: "POST"
      }, `${process.env.NGROK_URL}/api/twilio/voice/response?step=operator`)
    } else {
      // 次のステップのユーザー入力を待つ
      response.gather({
        input: ["speech"],
        language: "ja-JP",
        speechTimeout: "auto",
        action: `${process.env.NGROK_URL}/api/twilio/voice/response?step=${nextStep}`,
        method: "POST",
        timeout: 10,
      })
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
    
    // エラー発生時は謝罪メッセージを返す
    try {
      const errorResponse = new VoiceResponse()
      errorResponse.say({
        voice: "Polly.Mizuki",
        language: "ja-JP"
      }, "申し訳ありません。システムエラーが発生しました。担当者におつなぎします。少々お待ちください。")
      
      errorResponse.redirect({
        method: "POST"
      }, `${process.env.NGROK_URL}/api/twilio/voice/connect/operator`)
      
      return new NextResponse(errorResponse.toString(), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      })
    } catch (nestedError) {
      console.error("=== 二次エラー発生 ===", nestedError)
      // 最終的なフォールバック - 空のレスポンスを返す
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      })
    }
  }
}
