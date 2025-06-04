// app/api/twilio/voice/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import axios from "axios";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

const VOICE_ID = "Mv8AjrYZCBkdsmDHNwcB"; // Ishibashi の voice_id
const MODEL_ID = "eleven_multilingual_v2";
const AUDIO_FILE_NAME = "intro.mp3"; // 保存ファイル名
const AUDIO_FILE_PATH = path.resolve("./public/audio", AUDIO_FILE_NAME);
const AUDIO_FILE_URL = `${process.env.NGROK_URL}/audio/${AUDIO_FILE_NAME}`;
const ELEVENLABS_API_KEY = "sk_86037808263f9ab28e74649c4cc2694b256d3efc8f8e7558";

/**
 * 通話開始時のエントリーポイント
 */
export async function GET() {
  return await voiceResponse();
}

export async function POST() {
  return await voiceResponse();
}

async function voiceResponse() {
  try {
    const speechText = "お世話になります。わたくしＡＩコールシステムの安達といいますが、";

    // ElevenLabsで音声生成 → MP3保存
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
      const audioBuffer = await generateSpeechFromElevenLabs(speechText);
      fs.writeFileSync(AUDIO_FILE_PATH, audioBuffer);
    }

    // TwiML生成（<Play>で再生）
    const response = new VoiceResponse();
    response.play(AUDIO_FILE_URL);
    response.gather({
      input: ["speech"],
      language: "ja-JP",
      speechTimeout: "auto",
      action: `${process.env.NGROK_URL}/api/twilio/voice/response?state=initial`,
      method: "POST",
      timeout: 5
    });

    const twiml = response.toString();
    console.log("Generated TwiML:", twiml);

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "no-cache"
      },
    });
  } catch (error) {
    console.error("Error generating voice response:", error);
    return new NextResponse("", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

async function generateSpeechFromElevenLabs(text: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const headers = {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
    "Accept": "audio/mpeg",
  };

  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  };

  const response = await axios.post(url, body, { headers, responseType: "arraybuffer" });
  return Buffer.from(response.data);
}
