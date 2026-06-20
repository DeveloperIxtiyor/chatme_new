"use client"
import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { groupsApi } from "@/lib/api"
import { useChatStore } from "@/store/chatStore"

export function CreateGroupModal() {
  const { addGroup } = useChatStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    setError("")
    try {
      const group = await groupsApi.create({ name: name.trim(), description: description.trim() || null })
      addGroup(group)
      setOpen(false)
      setName("")
      setDescription("")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || "Guruh yaratishda xato")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full justify-start gap-2 rounded-3xl border border-primary/20 bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-lg shadow-primary/20 transition hover:bg-card"
        >
          <Plus className="h-4 w-4" />
          Yangi guruh
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl w-full rounded-[2rem] border border-border bg-card shadow-lg shadow-primary/10 p-0 overflow-hidden">
        <div className="relative overflow-hidden bg-linear-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.35em] text-white/80">ChatMe</div>
            <h2 className="mt-4 text-3xl font-semibold">Yangi guruh yaratish</h2>
            <p className="mt-3 text-sm text-white/80 max-w-lg">
              Guruh nomi va tavsifini kiriting. So‘ngra a’zolarni taklif qiling va suhbatni boshlang.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-5 px-6 py-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="group-name">Guruh nomi *</Label>
            <Input
              id="group-name"
              placeholder="Guruh nomini kiriting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="bg-input/90 border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-desc">Tavsif (ixtiyoriy)</Label>
            <Textarea
              id="group-desc"
              placeholder="Guruh haqida qisqa ma'lumot"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className="bg-input/90 border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
              Bekor
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/20" disabled={isLoading || !name.trim()}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Yaratilmoqda...</> : "Yaratish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
