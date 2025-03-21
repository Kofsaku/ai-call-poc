import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const callStatus = formData.get("CallStatus")
    const callSid = formData.get("CallSid")

    console.log("Call status update:", {
      callSid,
      status: callStatus,
      timestamp: new Date().toISOString()
    })

    // 空のTwiMLレスポンスを返す
    return new NextResponse("", {
      status: 204,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Error processing status callback:", error)
    return new NextResponse("", {
      status: 204,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
} 