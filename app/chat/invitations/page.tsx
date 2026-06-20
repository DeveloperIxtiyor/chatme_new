'use client'
import { useEffect, useState } from 'react'
import { Check, X, Loader2, MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chatStore'
import { invitationsApi } from '@/lib/api'
import { getInitials } from '@/lib/utils'

interface Invitation {
  id: number
  group_id: number
  group_name?: string
  group?: {
    id: number
    name: string
  }
  invited_by?: string
  inviter?: {
    username: string
  }
  created_at: string
}

export default function InvitationsPage() {
  const { fetchGroups } = useChatStore()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const data = await invitationsApi.getMyInvitations()
      setInvitations(data)
    } catch (error) {
      console.error("Takliflarni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleAccept = async (id: number) => {
    setActionId(id)
    try {
      await invitationsApi.accept(id)
      setInvitations(prev => prev.filter(item => item.id !== id))
      if (fetchGroups) fetchGroups()
    } catch (error) {
      console.error("Taklifni qabul qilishda xato:", error)
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionId(id)
    try {
      await invitationsApi.reject(id)
      setInvitations(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error("Taklifni rad etishda xato:", error)
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card shrink-0">
        <h2 className="font-semibold text-base">Kelgan taklifnomalar</h2>
        <p className="text-xs text-muted-foreground">Sizni guruhlarga qo'shilishga taklif qilishgan so'rovlar ro'yxati</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {invitations.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <MailOpen className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">Hozircha yangi takliflar yo'q</p>
            <p className="text-xs opacity-70 mt-0.5">Sizni biror guruhga taklif qilishsa, shu yerda paydo bo'ladi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold shrink-0">
                    {getInitials(invite.group?.name || invite.group_name || "Noma'lum guruh")}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">{invite.group?.name || invite.group_name}</h4>
                    <p className="text-xs text-muted-foreground truncate">Taklif qildi: <span className="font-medium text-foreground">@{invite.inviter?.username || invite.invited_by || 'no-name'}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleAccept(invite.id)} disabled={actionId === invite.id}>
                    {actionId === invite.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> Qabul qilish</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(invite.id)} disabled={actionId === invite.id}>
                    <X className="h-3.5 w-3.5 mr-1" /> Rad etish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
