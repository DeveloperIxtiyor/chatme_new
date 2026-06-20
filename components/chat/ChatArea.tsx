'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Send, Loader2, Trash2, ArrowLeft, UserPlus, Users,
  MoreVertical, Pencil, Info, X, Check, Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/store/chatStore'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { groupsApi, usersApi } from '@/lib/api'
import type { UserResponse } from '@/types'
import { cn, getAvatarColor } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatAreaProps {
  groupId: number
}

const CHAT_BG_IMAGE = '/images/chat-bg.jpg'

export function ChatArea({ groupId }: ChatAreaProps) {
  const {
    messages, groups, isLoadingMessages, isSending,
    fetchMessages, pollMessages, sendMessage, deleteMessage, leaveGroup, kickMember, setActiveGroup, fetchGroups
  } = useChatStore()

  const { user, fetchMe } = useAuthStore()
  const router = useRouter()

  // ── user yo'q bo'lsa — token bilan yukla ──────────────────────
  useEffect(() => {
    if (!user) {
      fetchMe().catch(() => router.push('/login'))
    }
  }, [user, fetchMe, router])

  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [infoOpen, setInfoOpen] = useState(false)
  const [activeInfoTab, setActiveInfoTab] = useState<'general' | 'members' | 'invite'>('general')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState(false)

  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [kickingId, setKickingId] = useState<number | null>(null)
  const [isLeavingGroup, setIsLeavingGroup] = useState(false)

  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteSuggestions, setInviteSuggestions] = useState<UserResponse[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showInviteSuggestions, setShowInviteSuggestions] = useState(false)
  const inviteInputRef = useRef<HTMLInputElement>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentGroup = groups.find(g => g.id === groupId)
  const [groupDetail, setGroupDetail] = useState<any>(null)

  useEffect(() => {
    if (!groupId) return
    groupsApi.get(groupId).then(setGroupDetail).catch(() => {})
  }, [groupId])

  const rawData = messages[groupId]
  const currentMessages = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === 'object' && Array.isArray((rawData as any).messages)
      ? (rawData as any).messages
      : []

  useEffect(() => {
    if (!groupId) return
    setActiveGroup(groupId)
    fetchMessages(groupId)
    fetchGroups()
    return () => setActiveGroup(null)
  }, [groupId, fetchMessages, setActiveGroup, fetchGroups])

  useEffect(() => {
    if (!groupId) return
    const intervalId = setInterval(() => pollMessages(groupId), 3000)
    return () => clearInterval(intervalId)
  }, [groupId, pollMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  // ── isMe: har doim ishonchli — user yuklanganidan keyin ───────
  const getIsMe = (senderUsername: string) => {
    if (!user?.username) return false
    return senderUsername === user.username
  }

  const isOwner = !!user?.username && groupDetail?.owner?.username === user.username

  const isAdmin = !!user?.username && (
    groupDetail?.owner?.username === user.username ||
    members.find(m => m.user?.username === user.username)?.role === 'admin'
  )

  // ── Search users (debounced) ───────────────────────────────────
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) { setInviteSuggestions([]); return }
    setIsLoadingSuggestions(true)
    try {
      const results = await usersApi.search(query.trim())
      setInviteSuggestions(Array.isArray(results) ? results : [])
    } catch {
      setInviteSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  const handleInviteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInviteUsername(val)
    setInviteError('')
    setInviteSuccess('')
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (val.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => searchUsers(val), 400)
    } else {
      setInviteSuggestions([])
    }
  }

  // ── Fetch members ──────────────────────────────────────────────
  const loadMembers = async () => {
    setLoadingMembers(true)
    try {
      const data: any = await groupsApi.getMembers(groupId)
      if (Array.isArray(data)) setMembers(data)
      else if (data && Array.isArray(data.members)) setMembers(data.members)
      else setMembers([])
    } catch {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const openMembers = async () => {
    setActiveInfoTab('members')
    setInfoOpen(true)
    await loadMembers()
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !groupId || isSending) return
    try {
      const t = text.trim()
      setText('')
      await sendMessage(groupId, t)
    } catch (err) {
      console.error('Xabar ketmadi:', err)
    }
  }

  const openDeleteModal = (id: number) => {
    setSelectedMessageId(id)
    setDeleteDialogOpen(true)
  }
  const confirmDelete = async () => {
    if (!selectedMessageId || !groupId) return
    setIsDeleting(true)
    try {
      await deleteMessage(groupId, selectedMessageId)
      setDeleteDialogOpen(false)
      setSelectedMessageId(null)
    } catch (err) {
      console.error("O'chirishda xato:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Leave group ────────────────────────────────────────────────
  const handleLeaveGroup = async () => {
    if (!groupId) return
    if (!confirm("Guruhdan chiqishni istaysizmi?")) return
    setIsLeavingGroup(true)
    setInfoError('')
    try {
      await leaveGroup(groupId)
      setInfoOpen(false)
      router.push('/chat')
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Guruhdan chiqishda xato yuz berdi"
      setInfoError(msg)
      console.error('Leave xatosi:', err?.response?.data ?? err)
    } finally {
      setIsLeavingGroup(false)
    }
  }

  // ── Kick member ────────────────────────────────────────────────
  const handleKickMember = async (member: any) => {
    if (!groupId || !member?.user_id) return
    const name = member.user?.username || 'Foydalanuvchi'
    if (!confirm(`${name}ni guruhdan chiqarib yuborishni xohlaysizmi?`)) return
    setKickingId(member.user_id)
    setInfoError('')
    try {
      await kickMember(groupId, member.user_id)
      setMembers(curr => curr.filter(m => m.user_id !== member.user_id))
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "A'zoni chiqarishda xato yuz berdi"
      setInfoError(msg)
      console.error('Kick xatosi:', err?.response?.data ?? err)
    } finally {
      setKickingId(null)
    }
  }

  const openInfo = () => {
    setEditName(currentGroup?.name ?? '')
    setEditDesc(currentGroup?.description ?? '')
    setEditing(false)
    setInfoError('')
    setActiveInfoTab('general')
    setInfoOpen(true)
  }
  const saveInfo = async () => {
    if (!editName.trim()) { setInfoError("Guruh nomi bo'sh bo'lishi mumkin emas"); return }
    setIsSavingInfo(true)
    setInfoError('')
    try {
      await groupsApi.update(groupId, { name: editName.trim(), description: editDesc.trim() })
      useChatStore.setState(state => ({
        groups: state.groups.map(g =>
          g.id === groupId ? { ...g, name: editName.trim(), description: editDesc.trim() } : g
        )
      }))
      setEditing(false)
    } catch {
      setInfoError("Saqlashda xato yuz berdi")
    } finally {
      setIsSavingInfo(false)
    }
  }

  const handleDeleteGroup = async () => {
    setIsDeletingGroup(true)
    try {
      await groupsApi.delete(groupId)
      useChatStore.setState(state => ({ groups: state.groups.filter(g => g.id !== groupId) }))
      setInfoOpen(false)
      router.push('/chat')
    } catch {
      setInfoError("Guruhni o'chirishda xato yuz berdi")
    } finally {
      setIsDeletingGroup(false)
      setDeleteGroupConfirm(false)
    }
  }

  const openInvite = () => {
    setInviteUsername('')
    setInviteSuggestions([])
    setInviteError('')
    setInviteSuccess('')
    setActiveInfoTab('invite')
    setInfoOpen(true)
  }
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return
    setIsInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      await groupsApi.invite(groupId, { username: inviteUsername.trim() })
      setInviteSuccess(`${inviteUsername} ga taklif yuborildi!`)
      setInviteUsername('')
      setInviteSuggestions([])
    } catch (err: any) {
      setInviteError(err?.response?.data?.detail ?? "Taklif yuborishda xato")
    } finally {
      setIsInviting(false)
    }
  }

  // user yuklanmaguncha spinner
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen md:h-full text-foreground relative">

      {/* HEADER */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border bg-card/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8"
            onClick={() => router.push('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500
                       flex items-center justify-center text-white font-bold text-sm shrink-0 cursor-pointer"
            onClick={openInfo}>
            {currentGroup?.name?.charAt(0)?.toUpperCase() ?? 'G'}
          </div>
          <div className="min-w-0 cursor-pointer" onClick={openInfo}>
            <h2 className="font-semibold text-sm md:text-base leading-tight truncate text-foreground">
              {currentGroup?.name ?? 'Guruh'}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {currentGroup?.description || `${groupDetail?.member_count ?? ''} a'zo`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm"
            className="hidden sm:flex gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
            onClick={openMembers}>
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">{groupDetail?.member_count ?? ''} a'zo</span>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={openMembers}>
            <Users className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={openInfo} className="gap-2 cursor-pointer">
                <Info className="h-4 w-4" /> Guruh ma'lumotlari
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openMembers} className="gap-2 cursor-pointer">
                <Users className="h-4 w-4" /> A'zolar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openInvite} className="gap-2 cursor-pointer">
                <UserPlus className="h-4 w-4" /> Taklif yuborish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 relative">
        {/* Fon rasmi — alohida fixed qatlam, scroll bilan cho'zilmaydi/kattalashmaydi */}
        <div
          className="fixed inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `url(${CHAT_BG_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="fixed inset-0 bg-background/60 pointer-events-none -z-10" />
        <div className="relative z-10 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center pt-20">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="flex items-center justify-center pt-20 text-center p-6">
              <p className="text-sm text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                Suhbatni boshlash uchun birinchi xabarni yuboring!
              </p>
            </div>
          ) : (
            currentMessages.map((msg: any) => {
              const senderName = msg.sender?.username ?? 'Foydalanuvchi'
              const isMe = getIsMe(senderName)
              return (
                <div key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}>
                  <div className={`flex items-center gap-2 max-w-[85%] md:max-w-[72%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {isMe ? (
                      <div
                        className="p-3 rounded-2xl wrap-break-word cursor-pointer transition-transform active:scale-[0.99]
                                   bg-linear-to-br from-violet-500 to-fuchsia-500 text-white rounded-tr-none shadow-xl"
                        onClick={() => openDeleteModal(msg.id)}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-sm p-3">
                        <p className="text-[11px] font-semibold mb-1 text-violet-400">{senderName}</p>
                        <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                      </div>
                    )}
                    {isMe && (
                      <Button onClick={() => openDeleteModal(msg.id)}
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-2">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend}
        className="p-2 md:p-4 border-t border-border bg-card/90 backdrop-blur-sm flex gap-2 items-center">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 py-5 rounded-2xl border border-border bg-input/90 text-foreground focus-visible:ring-ring"
          disabled={isLoadingMessages}
        />
        <Button type="submit" size="icon"
          className="h-11 w-11 bg-linear-to-br from-violet-500 to-fuchsia-500 text-white rounded-2xl shadow-xl transition-transform active:scale-95"
          disabled={!text.trim() || isSending || isLoadingMessages}>
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>

      {/* MODAL 1 — Delete message */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Xabarni o&apos;chirish</DialogTitle>
            <DialogDescription className="text-sm">
              Haqiqatdan ham ushbu xabarni hamma uchun o&apos;chirib tashlamoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" className="rounded-xl flex-1 sm:flex-none"
              onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Bekor qilish
            </Button>
            <Button variant="destructive" className="rounded-xl flex-1 sm:flex-none"
              onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hamma uchun o'chirish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2 — Group Info */}
      <Dialog open={infoOpen} onOpenChange={v => { setInfoOpen(v); if (!v) { setActiveInfoTab('general'); setEditing(false) } }}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-2xl p-0 [&>button.absolute]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Guruh ma&apos;lumotlari</DialogTitle>
            <DialogDescription>Guruh nomi, tavsifi va admin haqida ma&apos;lumot</DialogDescription>
          </DialogHeader>

          <div className="bg-linear-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-6 text-white relative rounded-t-2xl overflow-hidden">
            <button onClick={() => setInfoOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center text-3xl font-bold mb-3">
              {currentGroup?.name?.charAt(0)?.toUpperCase() ?? 'G'}
            </div>
            <h2 className="font-bold text-2xl leading-tight">{currentGroup?.name ?? 'Guruh'}</h2>
            <p className="text-sm text-white/70 mt-1">{groupDetail?.member_count ?? 0} a&apos;zo</p>
            <div className="mt-5 flex items-center gap-1 rounded-full bg-white/10 p-1 text-xs font-semibold">
              {(['general', 'members', 'invite'] as const).map(tab => (
                <button key={tab} type="button"
                  onClick={() => {
                    setActiveInfoTab(tab)
                    if (tab === 'members') void loadMembers()
                    if (tab !== 'general') setEditing(false)
                    if (tab === 'invite') { setInviteUsername(''); setInviteError(''); setInviteSuccess(''); setInviteSuggestions([]) }
                  }}
                  className={cn(
                    'flex-1 rounded-full px-3 py-2 transition text-center',
                    activeInfoTab === tab ? 'bg-white text-violet-700 font-bold' : 'text-white/80 hover:bg-white/20'
                  )}>
                  {tab === 'general' ? 'Umumiy' : tab === 'members' ? "A'zolar" : 'Taklif'}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-5 rounded-b-2xl">

            {/* General */}
            {activeInfoTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guruh nomi</label>
                  {editing
                    ? <Input value={editName} onChange={e => setEditName(e.target.value)}
                        className="mt-2 rounded-2xl bg-input/90 border border-border text-foreground" placeholder="Guruh nomi" />
                    : <p className="text-sm mt-2 text-foreground">{currentGroup?.name || <span className="text-muted-foreground italic">Guruh nomi yo&apos;q</span>}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tavsif</label>
                  {editing
                    ? <Input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                        className="mt-2 rounded-2xl bg-input/90 border border-border text-foreground" placeholder="Guruh tavsifi..." />
                    : <p className="text-sm mt-2 text-foreground">{currentGroup?.description || <span className="text-muted-foreground italic">Tavsif yo&apos;q</span>}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</label>
                  <div className="flex items-center gap-3 mt-3 rounded-2xl bg-card/80 p-3 border border-border">
                    <div className="h-9 w-9 rounded-full bg-yellow-400/15 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{groupDetail?.owner?.username ?? 'Admin'}</p>
                      <p className="text-xs text-muted-foreground">Guruh egasi</p>
                    </div>
                  </div>
                </div>

                {infoError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{infoError}</p>}

                <div className="space-y-3">
                  {isAdmin && (
                    editing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="rounded-2xl h-11"
                          onClick={() => setEditing(false)} disabled={isSavingInfo}>Bekor</Button>
                        <Button className="rounded-2xl h-11" onClick={saveInfo} disabled={isSavingInfo}>
                          {isSavingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Saqlash</>}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full rounded-2xl h-11 gap-2" onClick={() => setEditing(true)}>
                        <Pencil className="h-4 w-4" /> Guruhni tahrirlash
                      </Button>
                    )
                  )}

                  {/* Leave — owner EMA a'zolar uchun */}
                  {!isOwner && (
                    <Button variant="outline"
                      className="w-full rounded-2xl h-11 gap-2 text-orange-500 hover:text-orange-500 hover:bg-orange-500/10 border-orange-400/30"
                      onClick={handleLeaveGroup} disabled={isLeavingGroup}>
                      {isLeavingGroup
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Chiqilmoqda...</>
                        : <><ArrowLeft className="h-4 w-4" />Guruhdan chiqish</>}
                    </Button>
                  )}

                  {/* Delete — faqat owner */}
                  {isOwner && !editing && (
                    deleteGroupConfirm ? (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 space-y-3">
                        <p className="text-xs text-destructive font-medium text-center">
                          Guruhni o&apos;chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo&apos;lmaydi.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="rounded-2xl h-10"
                            onClick={() => setDeleteGroupConfirm(false)} disabled={isDeletingGroup}>Bekor</Button>
                          <Button size="sm" variant="destructive" className="rounded-2xl h-10"
                            onClick={handleDeleteGroup} disabled={isDeletingGroup}>
                            {isDeletingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ha, o'chirish"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline"
                        className="w-full rounded-2xl h-11 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setDeleteGroupConfirm(true)}>
                        <Trash2 className="h-4 w-4" /> Guruhni o&apos;chirish
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {activeInfoTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">A&apos;zolar · {members.length}</h3>
                    <p className="text-xs text-muted-foreground">Guruh a&apos;zolari ro&apos;yxati</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full h-9"
                    onClick={loadMembers} disabled={loadingMembers}>Yangilash</Button>
                </div>
                {infoError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{infoError}</p>}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {loadingMembers ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">A&apos;zolar topilmadi</p>
                  ) : (
                    members.map((m: any, idx: number) => {
                      const memberIsOwner =
                        m.user?.username === groupDetail?.owner?.username ||
                        m.user_id === currentGroup?.owner_id
                      const memberName = m.user?.username ?? '?'
                      const memberBio = m.user?.bio ?? ''
                      const avatarColor = getAvatarColor(m.user_id ?? idx)
                      const canKick = isAdmin && !memberIsOwner && m.user?.username !== user?.username
                      return (
                        <div key={m.id ?? m.user_id}
                          className="flex items-center gap-3 px-3 py-3 rounded-3xl bg-card/80 border border-border hover:border-primary/50 transition-colors">
                          <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{memberName}</p>
                            {memberBio && <p className="text-xs text-muted-foreground truncate">{memberBio}</p>}
                          </div>
                          {memberIsOwner ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-500 bg-yellow-400/15 px-2 py-1 rounded-full shrink-0">
                              <Crown className="h-3 w-3" /> Admin
                            </span>
                          ) : canKick ? (
                            <Button size="sm" variant="destructive" className="h-8 rounded-full text-xs px-3"
                              onClick={() => handleKickMember(m)}
                              disabled={kickingId === m.user_id}>
                              {kickingId === m.user_id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : 'Chiqarish'}
                            </Button>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Invite */}
            {activeInfoTab === 'invite' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Foydalanuvchi qidirish</h3>
                  <p className="text-xs text-muted-foreground">Username bo&apos;yicha toping va guruhga taklif qiling</p>
                </div>
                <form onSubmit={handleInvite} className="space-y-4">
                  {inviteError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{inviteError}</p>}
                  {inviteSuccess && <p className="text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-xl">{inviteSuccess}</p>}
                  <div className="relative">
                    <Input
                      ref={inviteInputRef}
                      value={inviteUsername}
                      onChange={handleInviteInputChange}
                      onFocus={() => setShowInviteSuggestions(true)}
                      onBlur={() => window.setTimeout(() => setShowInviteSuggestions(false), 150)}
                      placeholder="@username..."
                      className="rounded-2xl bg-input/90 border border-border text-foreground"
                    />
                    {showInviteSuggestions && inviteUsername.trim() && (
                      <div className="absolute left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
                        {isLoadingSuggestions ? (
                          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Qidirilmoqda...
                          </div>
                        ) : inviteSuggestions.length > 0 ? (
                          inviteSuggestions.map((u) => (
                            <button key={u.id} type="button"
                              onMouseDown={() => {
                                setInviteUsername(u.username)
                                setShowInviteSuggestions(false)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full ${getAvatarColor(u.id)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{u.username}</p>
                                <p className="text-xs text-muted-foreground">{u.bio || 'Foydalanuvchi'}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">Foydalanuvchi topilmadi</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl"
                      onClick={() => setInfoOpen(false)}>Yopish</Button>
                    <Button type="submit" className="flex-1 rounded-2xl"
                      disabled={isInviting || !inviteUsername.trim()}>
                      {isInviting
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Yuborilmoqda...</>
                        : 'Taklif yuborish'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}