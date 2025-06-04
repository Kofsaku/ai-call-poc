import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const VOICE_ID = "Mv8AjrYZCBkdsmDHNwcB"; // Ishibashi の voice_id
const MODEL_ID = "eleven_multilingual_v2";
const ELEVENLABS_API_KEY = "sk_86037808263f9ab28e74649c4cc2694b256d3efc8f8e7558";
const AUDIO_DIR = path.resolve("./public/audio");

export async function getElevenLabsAudioUrl(text: string, fileName?: string): Promise<string> {
  const name = fileName ?? `${crypto.createHash("md5").update(text).digest("hex")}.mp3`;
  const filePath = path.join(AUDIO_DIR, name);
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const audioBuffer = await generateSpeechFromElevenLabs(text);
    fs.writeFileSync(filePath, audioBuffer);
  }
  return `${process.env.NGROK_URL}/audio/${name}`;
}

async function generateSpeechFromElevenLabs(text: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const headers = {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  };
  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  };
  const response = await axios.post(url, body, { headers, responseType: "arraybuffer" });
  return Buffer.from(response.data);
}
