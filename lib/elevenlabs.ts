import twilio from "twilio"

export function sayElevenLabs(response: twilio.twiml.VoiceResponse, text: string) {
  const baseUrl = process.env.NGROK_URL || ""
  const encoded = encodeURIComponent(text)
  const url = `${baseUrl}/api/elevenlabs/tts?text=${encoded}`
  response.play(url)
}
