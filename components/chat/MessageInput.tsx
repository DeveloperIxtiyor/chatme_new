"use client"
import { useState, useRef, useCallback } from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/store/chatStore"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  groupId: number
}

// "export function MessageInput" ekanligiga ishonch hosil qiling
export function MessageInput({ groupId }: MessageInputProps) {
  const { sendMessage, isSending } = useChatStore()
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [])

  const handleSend = async () => {
    const text = content.trim()
    if (!text || isSending) return
    setContent("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    try {
      if (typeof sendMessage === "function") {
        await sendMessage(groupId, text)
      }
    } catch {
      setContent(text) // xatolik bo'lsa matnni qaytaradi
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-border bg-card/90">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing... (Enter — yuborish)"
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl border border-border bg-input/90 px-4 py-2.5 text-sm text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors",
            "placeholder:text-muted-foreground overflow-hidden min-h-10 max-h-30"
          )}
          disabled={isSending}
        />
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!content.trim() || isSending}
        className="h-10 w-10 rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shrink-0"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
