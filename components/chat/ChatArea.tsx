'use client'
import { useEffect, useState, useRef } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/store/chatStore'
import { InviteModal } from "@/components/chat/InviteModal"
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

interface ChatAreaProps {
	groupId: number
}

export function ChatArea({ groupId }: ChatAreaProps) {
	// 1. Store ulanishlari
	const {
		messages,
		isLoadingMessages,
		isSending,
		fetchMessages,
		pollMessages,
		sendMessage,
		deleteMessage,
		setActiveGroup
	} = useChatStore()

	const { user } = useAuthStore()
	const [text, setText] = useState('')
	const router = useRouter()
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Telegram menyusi va o'chirish uchun holatlar
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	// Xabarlarni xavfsiz massiv ko'rinishida olish (TypeError oldini olish uchun)
	const rawData = messages[groupId]
	const currentMessages = Array.isArray(rawData)
		? rawData
		: rawData && typeof rawData === 'object' && Array.isArray((rawData as any).messages)
			? (rawData as any).messages
			: [];

	// 2. Dastlabki yuklash logikasi
	useEffect(() => {
		if (!groupId) return

		setActiveGroup(groupId)
		fetchMessages(groupId)

		return () => setActiveGroup(null)
	}, [groupId, fetchMessages, setActiveGroup])

	// 3. Short Polling (Har 3 soniyada xabarlarni yangilab turish)
	useEffect(() => {
		if (!groupId) return

		const intervalId = setInterval(() => {
			pollMessages(groupId)
		}, 3000)

		return () => clearInterval(intervalId)
	}, [groupId, pollMessages])

	// Skrollni pastga silliq tushirish
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [currentMessages])

	// 4. Xabar yuborish funksiyasi
	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!text.trim() || !groupId || isSending) return

		try {
			const currentText = text.trim()
			setText('')
			await sendMessage(groupId, currentText)
		} catch (err) {
			console.error("Xabar ketmadi:", err)
		}
	}

	// 5. Telegram modal oynasini ochish funksiyasi
	const openDeleteModal = (messageId: number) => {
		setSelectedMessageId(messageId)
		setDeleteDialogOpen(true)
	}

	// 6. Haqiqiy o'chirishni tasdiqlash funksiyasi
	const confirmDelete = async () => {
		if (!selectedMessageId || !groupId) return
		setIsDeleting(true)
		try {
			await deleteMessage(groupId, selectedMessageId)
			setDeleteDialogOpen(false)
			setSelectedMessageId(null)
		} catch (err) {
			console.error("Xabarni o'chirishda xato:", err)
		} finally {
			setIsDeleting(false)
		}
	}
	return (
		<div className='flex flex-col h-screen md:h-full bg-slate-50 dark:bg-zinc-950 relative'>

			{/* Header */}
					<div className="flex items-center justify-between px-3 md:px-4 py-3 border-b bg-white dark:bg-zinc-900">
			<div className="flex items-center gap-3">
				
				{/* Mobil uchun orqaga tugmasi */}
				<Button
				variant="ghost"
				size="icon"
				className="md:hidden"
				onClick={() => router.push('/chat')}
				>
				<ArrowLeft className="h-5 w-5" />
				</Button>

				<div>
				<h2 className="font-semibold text-base md:text-lg">
					Guruh suhbati
				</h2>
				<p className="text-xs text-muted-foreground">
					Online
				</p>
				</div>
			</div>

			<InviteModal groupId={groupId} />
			</div>
			{/* Xabarlar oynasi */}
			<div className='flex-1 overflow-y-auto p-3 md:p-4 space-y-4'>
				{isLoadingMessages ? (
					<div className='flex justify-center items-center h-full'>
						<Loader2 className='animate-spin text-violet-500 h-8 w-8' />
					</div>
				) : currentMessages.length === 0 ? (
					<div className='flex items-center justify-center h-full text-center p-6'>
						<p className='text-sm text-muted-foreground bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-sm border border-border'>
							Suhbatni boshlash uchun birinchi xabarni yuboring!
						</p>
					</div>
				) : (
					currentMessages.map((msg: any) => {
						const isMe = msg.sender_id === user?.id || msg.sender?.id === user?.id

						return (
							<div
								key={msg.id}
								className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}
							>
								<div className={`flex items-center gap-2 max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
									<div
										className={`p-3 rounded-2xl break-words shadow-sm cursor-pointer transition-transform active:scale-[0.99] ${isMe
												? 'bg-violet-500 text-white rounded-tr-none'
												: 'bg-white dark:bg-zinc-900 text-foreground rounded-tl-none border border-zinc-100 dark:border-zinc-800'
											}`}
										onClick={() => isMe && openDeleteModal(msg.id)}
									>
										{!isMe && (
											<p className='text-[11px] font-bold text-violet-600 dark:text-violet-400 mb-0.5'>
												{msg.sender?.username || 'Foydalanuvchi'}
											</p>
										)}
										<p className='text-sm leading-relaxed'>{msg.content}</p>
									</div>

									{isMe && (
										<Button
											onClick={() => openDeleteModal(msg.id)}
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-xl"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
								<span className='text-[10px] text-muted-foreground px-2'>
									{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
								</span>
							</div>
						)
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input qismi */}
			<form
				onSubmit={handleSend}
				className='p-2 md:p-4 border-t border-border bg-white dark:bg-zinc-900 flex gap-2 items-center'
			>
				<Input
					value={text}
					onChange={e => setText(e.target.value)}
					placeholder='Xabar yozing...'
					className='flex-1 py-5 rounded-xl border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 focus-visible:ring-violet-500'
					disabled={isLoadingMessages}
				/>
				<Button
					type='submit'
					size='icon'
					className='h-11 w-11 bg-violet-500 hover:bg-violet-600 text-white rounded-xl shadow-md transition-transform active:scale-95'
					disabled={!text.trim() || isSending || isLoadingMessages}
				>
					{isSending ? (
						<Loader2 className='h-5 w-5 animate-spin' />
					) : (
						<Send className='h-5 w-5' />
					)}
				</Button>
			</form>

			{/* Telegram uslubidagi o'chirishni tasdiqlash modali */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="max-w-xs sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">Xabarni o&apos;chirish</DialogTitle>
						<DialogDescription className="text-sm">
							Haqiqatdan ham ushbu xabarni hamma uchun o&apos;chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo&apos;lmaydi.
						</DialogDescription>
					</DialogHeader>

					{/* DialogFooter muammosi o'rniga oddiy flex-div bilan almashtirildi */}
					<div className="flex flex-row gap-2 justify-end sm:space-x-0 mt-4 border-t border-transparent pt-2">
						<Button
							variant="ghost"
							className="rounded-xl flex-1 sm:flex-none"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							Bekor qilish
						</Button>
						<Button
							variant="destructive"
							className="bg-red-500 hover:bg-red-600 text-white rounded-xl flex-1 sm:flex-none"
							onClick={confirmDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Hamma uchun o'chirish"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
