"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, UserCog } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  company: string
}

type AICallDialogProps = {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

export default function AICallDialog({ isOpen, onClose, customer }: AICallDialogProps) {
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "active" | "transferred">("idle")
  const [prompt, setPrompt] = useState(
    "Introduce yourself as an AI assistant and ask if they're interested in our new product offerings.",
  )
  const [conversation, setConversation] = useState<Array<{ role: "ai" | "customer" | "human"; text: string }>>([])

  // Simulate starting a call
  const startCall = () => {
    setCallStatus("calling")
    setConversation([])

    // Simulate connection delay
    setTimeout(() => {
      setCallStatus("active")
      // Add initial AI message based on prompt
      setConversation([
        {
          role: "ai",
          text: "Hello, this is an AI assistant calling from our company. I'm reaching out to see if you might be interested in learning about our new product offerings. How are you doing today?",
        },
      ])
    }, 1500)
  }

  // Simulate customer response
  const simulateCustomerResponse = () => {
    if (callStatus !== "active") return

    setConversation((prev) => [
      ...prev,
      {
        role: "customer",
        text: "Hi there, I'm doing well. What kind of new products are you offering?",
      },
    ])
  }

  // Simulate AI response
  const simulateAIResponse = () => {
    if (callStatus !== "active") return

    setConversation((prev) => [
      ...prev,
      {
        role: "ai",
        text: "We've just launched a new line of productivity tools designed specifically for businesses like yours. These tools can help streamline your workflow and increase efficiency by up to 30%. Would you like me to tell you more about the specific features?",
      },
    ])
  }

  // Transfer to human representative
  const transferToHuman = () => {
    setCallStatus("transferred")
    setConversation((prev) => [
      ...prev,
      {
        role: "ai",
        text: "I'd like to transfer you to one of our human representatives who can provide more detailed information. Please hold for a moment.",
      },
      {
        role: "human",
        text: "Hello, this is a human representative. I understand you're interested in our new productivity tools. How can I assist you further?",
      },
    ])
  }

  // End the call
  const endCall = () => {
    setCallStatus("idle")
    onClose()
  }

  if (!customer) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Call with {customer.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="call" className="flex-1 flex flex-col min-h-[400px]">
          <TabsList>
            <TabsTrigger value="call">Call</TabsTrigger>
            <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
          </TabsList>

          <TabsContent value="call" className="flex-1 flex flex-col">
            <div className="mb-4 p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {callStatus === "idle" ? (
                    <Button onClick={startCall} size="sm" variant="default">
                      <Phone className="mr-2 h-4 w-4" />
                      Start Call
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={transferToHuman}
                        size="sm"
                        variant="outline"
                        disabled={callStatus === "transferred"}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Transfer to Human
                      </Button>
                      <Button onClick={endCall} size="sm" variant="destructive">
                        End Call
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm">
                {callStatus === "idle" && <p>Call not started. Click "Start Call" to begin.</p>}
                {callStatus === "calling" && (
                  <p className="flex items-center">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
                    Calling {customer.phone}...
                  </p>
                )}
                {callStatus === "active" && (
                  <p className="flex items-center">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Call active - AI assistant speaking
                  </p>
                )}
                {callStatus === "transferred" && (
                  <p className="flex items-center">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Call transferred to human representative
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md p-4 mb-4 space-y-4">
              {conversation.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {callStatus === "idle" ? "Start the call to begin conversation" : "Connecting..."}
                </p>
              ) : (
                conversation.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "customer" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "ai"
                          ? "bg-primary text-primary-foreground"
                          : message.role === "human"
                            ? "bg-blue-500 text-white"
                            : "bg-muted"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">
                        {message.role === "ai"
                          ? "AI Assistant"
                          : message.role === "human"
                            ? "Human Representative"
                            : customer.name}
                      </p>
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {callStatus === "active" && (
              <div className="flex gap-2">
                <Button onClick={simulateCustomerResponse} variant="outline" className="flex-1">
                  Simulate Customer Response
                </Button>
                <Button onClick={simulateAIResponse} variant="outline" className="flex-1">
                  Simulate AI Response
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="ai-prompt">AI Call Prompt</Label>
                <Textarea
                  id="ai-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Enter instructions for the AI to follow during the call..."
                />
              </div>
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Prompt Tips</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Be specific about the purpose of the call</li>
                  <li>Include key talking points for the AI to cover</li>
                  <li>Specify how to handle common customer questions</li>
                  <li>Define when the AI should transfer to a human representative</li>
                </ul>
              </div>
            </div>

            <Button onClick={startCall} disabled={callStatus !== "idle"} className="mt-4">
              Apply Prompt & Start Call
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

