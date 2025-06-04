// app/api/twilio/voice/response/route.ts の例
import { NextResponse } from "next/server"
import twilio from "twilio"
import { getElevenLabsAudioUrl } from "@/lib/elevenlabs"

const VoiceResponse = twilio.twiml.VoiceResponse

async function addSpeech(res: twilio.twiml.VoiceResponse, text: string) {
  const url = await getElevenLabsAudioUrl(text)
  res.play(url)
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

    // 音声認識の信頼度チェック
    const confidenceValue = parseFloat(confidence?.toString() || "0")
    if (confidenceValue < 0.5) {
      console.log("音声認識の信頼度が低いため、再試行します")
      const response = new VoiceResponse()
      await addSpeech(response, "申し訳ありません。もう一度お願いできますでしょうか？")
      response.gather({
        input: ["speech"],
        language: "ja-JP",
        timeout: 15,
        speechTimeout: "auto",
        action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=initial`,
        method: "POST",
        // hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構"
      })
      return new NextResponse(response.toString(), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      })
    }

    // URLからクエリパラメータの`state`を取得
    const { searchParams } = new URL(request.url)
    const state = searchParams.get("state") || "initial"
    const response = new VoiceResponse()

    // ステートごとの応答ロジック
    switch (state) {
      case "initial":
        await addSpeech(response, "すみません、実は本日、");
        await addSpeech(response, "初めてお電話をさせていただきました！");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 30,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=second_response`,
          method: "POST",
          hints: "はい,ええ,"
        });
        break;
      case "first_response":
        await addSpeech(response, "弊社は生成ＡＩを使った新規顧客獲得テレアポのサービスを提供している会社でございまして、");
        await addSpeech(response, "是非、御社の営業の方にご案内できればと思いお電話をさせていただきました！");
        await addSpeech(response, "本日、営業の担当者さまはいらっしゃいますでしょうか？");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 30,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=check_availability`,
          method: "POST",
          hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構,外出,会議,打ち合わせ,電話中,社名,会社名,どちら様"
        });
        break;
      case "second_response":
        await addSpeech(response, "弊社は生成ＡＩを使った新規顧客獲得テレアポのサービスを提供している会社でございまして、");
        await addSpeech(response, "是非、御社の営業の方にご案内できればと思いお電話をさせていただきました！");
        await addSpeech(response, "本日、営業の担当者さまはいらっしゃいますでしょうか？");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 30,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=check_availability`,
          method: "POST",
          hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構,外出,会議,打ち合わせ,電話中"
        });
        break;
      case "check_availability":
        const userResponse = speechResult?.toString().toLowerCase() || "";
        
        if (userResponse.includes("社名") || userResponse.includes("会社名") || userResponse.includes("どちら様")) {
          await addSpeech(response, "ＡＩコールシステムの安達と申します。");
          await addSpeech(response, "本日、営業の担当者さまはいらっしゃいますでしょうか？");
          response.gather({
            input: ["speech"],
            language: "ja-JP",
            timeout: 30,
            speechTimeout: "auto",
            action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=check_availability`,
            method: "POST",
            hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構,外出,会議,打ち合わせ,電話中"
          });
        } else if (userResponse.includes("外出") || userResponse.includes("会議") ||
                  userResponse.includes("打ち合わせ") || userResponse.includes("電話中") ||
                  userResponse.includes("席を外") || userResponse.includes("不在")) {
          await addSpeech(response, "そうですか！");
          await addSpeech(response, "ではまたタイミングをみてお電話させていただきます。");
          await addSpeech(response, "ありがとうございました。");
          response.pause({ length: 5 });
          response.hangup();
        } else if (userResponse.includes("お断り") || userResponse.includes("結構") ||
                  userResponse.includes("失礼") || userResponse.includes("要らない")) {
          await addSpeech(response, "そうですか！");
          await addSpeech(response, "大変失礼を致しました。");
          await addSpeech(response, "また何かございましたら、よろしくお願い致します。");
          response.pause({ length: 5 });
          response.hangup();
        } else if (userResponse.includes("ホームページ") || userResponse.includes("メール") ||
                  userResponse.includes("問い合わせ") || userResponse.includes("書き込み")) {
          await addSpeech(response, "ではホームページから書き込みをさせていただきます。");
          await addSpeech(response, "ありがとうございました。");
          response.pause({ length: 5 });
          response.hangup();
        } else if (userResponse.includes("はい") || userResponse.includes("担当者")) {
          response.redirect({
            method: "POST"
          }, `${process.env.NGROK_URL}/api/twilio/voice/connect/operator`);
        } else {
          await addSpeech(response, "申し訳ありません。もう一度お願いできますでしょうか？");
          response.gather({
            input: ["speech"],
            language: "ja-JP",
            timeout: 30,
            speechTimeout: "auto",
            action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=check_availability`,
            method: "POST",
            hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構,外出,会議,打ち合わせ,電話中"
          });
        }
        break;
      case "introduction":
        await addSpeech(response, "弊社は生成ＡＩを使った新規顧客獲得テレアポのサービスでございまして、");
        await addSpeech(response, "是非、御社の営業の方にご案内できればと思いお電話をさせていただきました！");
        await addSpeech(response, "本日、営業の担当者さまはいらっしゃいますでしょうか？");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 15,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=check_availability`,
          method: "POST",
          hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構,外出,会議,打ち合わせ,電話中"
        });
        break;
      case "schedule_callback":
        await addSpeech(response, "ご指定いただいた時間に、改めてお電話させていただきます。");
        await addSpeech(response, "ご対応いただき、ありがとうございました。");
        response.pause({ length: 2 });
        response.hangup();
        break;
      case "repeat_company":
        await addSpeech(response, "ＡＩコールシステムの安達と申します。");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 15,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=introduction`,
          method: "POST",
          hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構"
        });
        break;
      case "unavailable":
        await addSpeech(response, "そうですか！");
        await addSpeech(response, "ではまたタイミングをみてお電話させていただきます。");
        await addSpeech(response, "ありがとうございました。");
        response.pause({ length: 2 });
        response.hangup();
        break;
      case "rejection":
        await addSpeech(response, "そうですか！");
        await addSpeech(response, "大変失礼を致しました。");
        await addSpeech(response, "また何かございましたら、よろしくお願い致します。");
        response.pause({ length: 2 });
        response.hangup();
        break;
      case "website":
        await addSpeech(response, "ではホームページから書き込みをさせていただきます。");
        await addSpeech(response, "ありがとうございました。");
        response.pause({ length: 2 });
        response.hangup();
        break;
      default:
        await addSpeech(response, "申し訳ありません。もう一度お願いできますでしょうか？");
        response.gather({
          input: ["speech"],
          language: "ja-JP",
          timeout: 15,
          speechTimeout: "auto",
          action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=initial`,
          method: "POST",
          // hints: "はい,いいえ,担当者,営業,お断り,ホームページ,また電話,失礼,結構"
        });
        break;
    }

    const twiml = response.toString()
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml; charset=utf-8" },
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
      await addSpeech(errorResponse, "申し訳ありません。システムエラーが発生しました。担当者におつなぎします。少々お待ちください。")
      
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
