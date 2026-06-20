# ChatMe — Frontend O'quv Qo'llanmasi

> Bu qo'llanma ChatMe loyihasini to'liq o'rganib chiqish va mustaqil yakunlash uchun yozilgan.  
> Har bir qadam ketma-ket bajarilishi kerak.

---

## 📋 Joriy holat

| Modul           | API (`lib/api.ts`)  | Sahifa                   | Holat                |
| --------------- | ------------------- | ------------------------ | -------------------- |
| **Auth**        | ✅ `authApi`        | ✅ `/login`, `/register` | To'liq tayyor        |
| **Users**       | ✅ `usersApi`       | ⬜ `/profile`            | API bor, sahifa yo'q |
| **Groups**      | ✅ `groupsApi`      | ⬜ `/chat` (Sidebar)     | API bor, UI yo'q     |
| **Messages**    | ⬜ `messagesApi`    | ⬜ `/chat/[id]`          | Hammasi siz yozasiz  |
| **Invitations** | ⬜ `invitationsApi` | ⬜ `/chat/invitations`   | Hammasi siz yozasiz  |

### Loyiha ishga tushirish

```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Brauzerda: `http://localhost:3000` → `/login` sahifasiga o'tadi.

---

## 🗂️ Fayl strukturasi (muhim fayllar)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         ← ✅ Login sahifasi
│   │   └── register/page.tsx      ← ✅ Register sahifasi
│   ├── (main)/
│   │   ├── layout.tsx             ← ✅ Client-side auth guard
│   │   └── profile/page.tsx       ← ⬜ TODO: 2-qadam
│   ├── chat/
│   │   ├── layout.tsx             ← ⬜ TODO: 3-qadam (Sidebar)
│   │   ├── page.tsx               ← ⬜ TODO: 3-qadam
│   │   ├── [groupId]/page.tsx     ← ⬜ TODO: 6-qadam
│   │   └── invitations/page.tsx   ← ⬜ TODO: 7-qadam
│   ├── layout.tsx                 ← ✅ Root layout
│   └── page.tsx                   ← ✅ / → /chat redirect
├── components/
│   ├── chat/                      ← ⬜ TODO: barcha chat komponentlar
│   ├── shared/                    ← ✅ UserAvatar, ThemeToggle, Providers
│   └── ui/                        ← ✅ shadcn komponentlar
├── lib/
│   └── api.ts                     ← ✅ Auth+Users+Groups; Messages+Invitations TODO
├── store/
│   ├── authStore.ts               ← ✅ To'liq
│   └── chatStore.ts               ← ⬜ Faqat groups; messages TODO
├── types/index.ts                 ← ✅ Barcha TypeScript tiplari
├── proxy.ts                       ← ⚠️  Middleware kodi bor, lekin ISHLAMAYDI
└── middleware.ts                  ← ⚠️  Nofaol (izoh bor)
```

---

## QADAM 1 — Route Himoyasini To'g'rilash

### Muammo nima?

`proxy.ts` faylini oching. Unda to'g'ri middleware kodi bor, lekin **2 ta xato** bor:

```
❌ Fayl nomi: proxy.ts        → ✅ Bo'lishi kerak: middleware.ts
❌ Funksiya nomi: export function proxy    → ✅ Bo'lishi kerak: export function middleware
```

Next.js faqat `middleware.ts` (yoki `middleware.js`) nomli faylni o'qiydi. Boshqa nomli fayl — oddiy TypeScript modul, middleware emas.

### Natija (hozircha):

- `/chat` ga token bo'lmasdan kirsa bo'ladi ← 🔓 himoyasiz
- Login qilgan foydalanuvchi `/login` ga kirsa qaytarilmaydi ← 🔄 redirect yo'q

### Tuzatish tartibi:

**1. `frontend/middleware.ts` faylini oching va butun tarkibini o'chiring.**

**2. `frontend/proxy.ts` faylini oching, barcha kodni ko'chiring va `middleware.ts` ga joylashtiring:**

```ts
// frontend/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/chat', '/profile', '/invitations']
const authPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const token =
		request.cookies.get('access_token')?.value ||
		request.headers.get('authorization')?.replace('Bearer ', '')

	const isProtected = protectedPaths.some(p => pathname.startsWith(p))
	const isAuthPath = authPaths.some(p => pathname.startsWith(p))

	if (isProtected && !token) {
		const url = new URL('/login', request.url)
		url.searchParams.set('from', pathname)
		return NextResponse.redirect(url)
	}

	if (isAuthPath && token) {
		return NextResponse.redirect(new URL('/chat', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
```

**3. `proxy.ts` faylini o'chiring** (yoki shunday qoldiring — zarar qilmaydi).

### Tekshirish:

```
✅ Browser da localhost:3000/chat ga o'ting — login sahifasiga redirect bo'lishi kerak
✅ Login qiling — /chat ga o'tishi kerak
✅ Login holatida localhost:3000/login ga o'ting — /chat ga redirect bo'lishi kerak
```

---

## QADAM 2 — Profil Sahifasi (`/profile`)

### Maqsad

`usersApi` allaqachon yozilgan. Endi `/profile` sahifasini yarating:

- Foydalanuvchi ma'lumotlarini ko'rsatish
- Bio va avatar URL tahrirlash

### Shadcn komponentlar (allaqachon o'rnatilgan)

```bash
# Agar yangi loyihada bo'lsangiz, quyidagilarni o'rnatishingiz kerak:
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add button
npx shadcn@latest add alert
```

### API (`lib/api.ts` da allaqachon bor)

```ts
usersApi.getMe() // GET /users/me  → UserResponse
usersApi.updateMe({ bio, avatar }) // PUT /users/me  → UserResponse
```

### `UserResponse` tipi (`types/index.ts`)

```ts
interface UserResponse {
	id: number
	username: string
	avatar: string | null
	bio: string | null
	created_at: string // ISO date string
}
```

### Sahifa kodi

`frontend/app/(main)/profile/page.tsx` faylini oching va quyidagi kodga almashtiring:

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/lib/api'

export default function ProfilePage() {
	const { user, setUser } = useAuthStore()
	const [bio, setBio] = useState(user?.bio ?? '')
	const [avatar, setAvatar] = useState(user?.avatar ?? '')
	const [isSaving, setIsSaving] = useState(false)
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState('')

	// user state o'zgarganda formani yangilash
	useEffect(() => {
		if (user) {
			setBio(user.bio ?? '')
			setAvatar(user.avatar ?? '')
		}
	}, [user])

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSaving(true)
		setError('')
		setSuccess(false)
		try {
			const updated = await usersApi.updateMe({
				bio: bio.trim() || null,
				avatar: avatar.trim() || null,
			})
			setUser(updated) // store da ham yangilanadi
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch {
			setError('Profilni yangilashda xato')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Topbar */}
			<div className='border-b border-border bg-card px-4 py-3 flex items-center gap-3'>
				<Button asChild variant='ghost' size='icon' className='h-8 w-8'>
					<Link href='/chat'>
						<ArrowLeft className='h-4 w-4' />
					</Link>
				</Button>
				<h1 className='font-semibold'>Mening profilim</h1>
			</div>

			<div className='max-w-lg mx-auto p-6 space-y-6'>
				{/* Avatar preview */}
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-4'>
							<div className='h-14 w-14 rounded-xl bg-violet-500 flex items-center justify-center text-white text-xl font-bold'>
								{user?.username?.[0]?.toUpperCase() ?? '?'}
							</div>
							<div>
								<p className='font-semibold'>{user?.username}</p>
								<p className='text-sm text-muted-foreground'>
									Qo&apos;shilgan:{' '}
									{user?.created_at
										? new Date(user.created_at).toLocaleDateString('uz-UZ')
										: '—'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Tahrirlash formasi */}
				<Card>
					<CardHeader className='pb-4'>
						<CardTitle className='text-base'>Profilni tahrirlash</CardTitle>
						<CardDescription>Bio va avatar URL ni yangilang</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSave} className='space-y-4'>
							{error && (
								<Alert variant='destructive'>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							{success && (
								<Alert>
									<AlertDescription>Profil yangilandi! ✓</AlertDescription>
								</Alert>
							)}

							<div className='space-y-2'>
								<Label>Username</Label>
								<Input
									value={user?.username ?? ''}
									disabled
									className='bg-muted'
								/>
								<p className='text-xs text-muted-foreground'>
									Username o&apos;zgartirib bo&apos;lmaydi
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='avatar'>Avatar URL</Label>
								<Input
									id='avatar'
									placeholder='https://example.com/avatar.jpg'
									value={avatar}
									onChange={e => setAvatar(e.target.value)}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='bio'>Bio</Label>
								<Textarea
									id='bio'
									placeholder="O'zingiz haqida..."
									value={bio}
									onChange={e => setBio(e.target.value)}
									rows={3}
									maxLength={300}
								/>
								<p className='text-xs text-muted-foreground text-right'>
									{bio.length}/300
								</p>
							</div>

							<Button type='submit' disabled={isSaving} className='w-full'>
								{isSaving ? (
									<>
										<Loader2 className='h-4 w-4 animate-spin' /> Saqlanmoqda...
									</>
								) : (
									<>
										<Save className='h-4 w-4' /> Saqlash
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
```

### Tekshirish

```
✅ /profile ga kiring — profil ma'lumotlari ko'rinishi kerak
✅ Bio ni o'zgartiring va Saqlash bosing — "Profil yangilandi!" xabari kelishi kerak
✅ Sahifani yangilang — yangi bio saqlanib qolishi kerak
```

---

## QADAM 3 — Chat Layouti va Sidebar

### Maqsad

`/chat/*` sahifalarida chap tomonda guruhlar ro'yxati va navigatsiya ko'rsatiladi.

```
┌──────────────────────────────────────────────┐
│  [Sidebar: 256px]  │  [main content]         │
│  - ChatMe logo     │                         │
│  - Guruhlar nav    │  /chat → welcome         │
│  - Guruh list      │  /chat/1 → ChatArea      │
│  - User menu       │  /chat/invitations → ... │
└──────────────────────────────────────────────┘
```

### Shadcn komponentlar

```bash
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
```

### 3.1 — `app/chat/layout.tsx` ni yangilash

```tsx
import { Sidebar } from '@/components/chat/Sidebar'

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className='flex h-screen overflow-hidden bg-background'>
			<Sidebar />
			<main className='flex-1 flex flex-col min-w-0'>{children}</main>
		</div>
	)
}
```

### 3.2 — Sidebar komponenti yaratish

`frontend/components/chat/Sidebar.tsx` faylini yarating:

```tsx
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, Users, Bell, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'

// Rang generatsiya — guruh ID dan rang
function getColor(id: number) {
	const colors = [
		'bg-violet-500',
		'bg-blue-500',
		'bg-green-500',
		'bg-orange-500',
		'bg-pink-500',
	]
	return colors[id % colors.length]
}

// Ism boshlarini olish: "My Group" → "MG"
function getInitials(name: string) {
	return name
		.split(' ')
		.map(w => w[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()
}

export function Sidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const { groups, fetchGroups, isLoadingGroups } = useChatStore()
	const { user, logout } = useAuthStore()

	useEffect(() => {
		fetchGroups()
	}, [fetchGroups])

	const handleLogout = () => {
		logout()
		router.push('/login')
	}

	// Aktiv guruh ID sini URL dan olish
	const activeId = pathname.match(/\/chat\/(\d+)/)?.[1]

	return (
		<div className='w-64 flex flex-col h-screen border-r border-border bg-card shrink-0'>
			{/* Header */}
			<div className='flex items-center gap-2 p-4 border-b border-border'>
				<div className='h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
					<MessageCircle className='h-4 w-4 text-white' />
				</div>
				<span className='font-bold text-lg bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent'>
					ChatMe
				</span>
			</div>

			{/* Navigatsiya */}
			<div className='flex items-center gap-1 px-3 py-2 border-b border-border'>
				<Link
					href='/chat'
					className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
						pathname === '/chat'
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-accent'
					}`}
				>
					<Users className='h-3.5 w-3.5' /> Guruhlar
				</Link>
				<Link
					href='/chat/invitations'
					className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
						pathname === '/chat/invitations'
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-accent'
					}`}
				>
					<Bell className='h-3.5 w-3.5' /> Takliflar
				</Link>
			</div>

			{/* Guruhlar sarlavhasi */}
			<div className='flex items-center justify-between px-3 py-2'>
				<span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
					Guruhlarim
				</span>
				{/* TODO (4-qadam): bu yerga <CreateGroupModal /> qo'shing */}
			</div>

			{/* Guruhlar ro'yxati */}
			<ScrollArea className='flex-1 px-2'>
				{isLoadingGroups ? (
					<div className='flex items-center justify-center py-8'>
						<div className='h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
					</div>
				) : groups.length === 0 ? (
					<div className='text-center py-8 text-sm text-muted-foreground px-4'>
						<Users className='h-8 w-8 mx-auto mb-2 opacity-30' />
						<p>Hali guruhlar yo&apos;q</p>
						<p className='text-xs mt-1'>
							Yangi guruh yarating yoki taklif kuting
						</p>
					</div>
				) : (
					<div className='space-y-0.5 pb-2'>
						{groups.map(group => (
							<Link key={group.id} href={`/chat/${group.id}`}>
								<div
									className={`flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
										activeId === String(group.id)
											? 'bg-primary/10 text-primary'
											: 'hover:bg-accent text-foreground'
									}`}
								>
									<div
										className={`h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColor(group.id)}`}
									>
										{getInitials(group.name)}
									</div>
									<div className='min-w-0'>
										<p className='text-sm font-medium truncate'>{group.name}</p>
										{group.description && (
											<p className='text-xs text-muted-foreground truncate'>
												{group.description}
											</p>
										)}
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</ScrollArea>

			<Separator />

			{/* Foydalanuvchi menyusi */}
			<div className='p-3'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className='w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent transition-colors'>
							<div className='h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center text-white text-sm font-bold'>
								{user?.username?.[0]?.toUpperCase() ?? '?'}
							</div>
							<div className='flex-1 min-w-0 text-left'>
								<p className='text-sm font-medium truncate'>{user?.username}</p>
							</div>
							<Settings className='h-3.5 w-3.5 text-muted-foreground' />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent side='top' align='start' className='w-48'>
						<DropdownMenuLabel className='text-xs'>
							{user?.username}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href='/profile'>Profil</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className='text-destructive focus:text-destructive cursor-pointer'
						>
							<LogOut className='h-4 w-4' /> Chiqish
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}
```

### 3.3 — `app/chat/page.tsx` (welcome sahifa)

```tsx
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
	return (
		<div className='flex-1 flex flex-col items-center justify-center text-center p-8'>
			<div className='h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6'>
				<MessageCircle className='h-10 w-10 text-white' />
			</div>
			<h2 className='text-2xl font-bold mb-2'>ChatMe&apos;ga xush kelibsiz!</h2>
			<p className='text-muted-foreground max-w-sm'>
				Chap tarafdagi guruhlardan birini tanlang yoki yangi guruh yarating.
			</p>
		</div>
	)
}
```

### Tekshirish

```
✅ /chat ga kiring — chap tomonda sidebar, o'rtada "ChatMe'ga xush kelibsiz!"
✅ Sidebar da guruhlar ro'yxati yuklangan bo'lishi kerak
✅ Guruhga bosing — /chat/1 ga o'tishi kerak
✅ Profil → /profile ga o'tishi kerak
✅ Chiqish → /login ga o'tishi kerak
```

---

## QADAM 4 — Guruh Yaratish Modal

### Maqsad

Sidebar dagi "+" tugmasiga bosib yangi guruh yaratish.

### Shadcn komponentlar

```bash
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
```

### API

```ts
groupsApi.create({ name, description }) // POST /groups → GroupResponse
```

### `GroupCreate` tipi

```ts
interface GroupCreate {
	name: string // majburiy, 1-100 belgi
	description?: string | null
	avatar?: string | null
}
```

### Komponent kodi

`frontend/components/chat/CreateGroupModal.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { groupsApi } from '@/lib/api'
import { useChatStore } from '@/store/chatStore'

export function CreateGroupModal() {
	const { addGroup } = useChatStore()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim()) return
		setIsLoading(true)
		setError('')
		try {
			const group = await groupsApi.create({
				name: name.trim(),
				description: description.trim() || null,
			})
			addGroup(group) // Sidebar da darhol ko'rinadi
			setOpen(false)
			setName('')
			setDescription('')
		} catch {
			setError('Guruh yaratishda xato')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size='icon' variant='ghost' className='h-6 w-6'>
					<Plus className='h-3.5 w-3.5' />
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-sm'>
				<DialogHeader>
					<DialogTitle>Yangi guruh yaratish</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleCreate} className='space-y-4 mt-2'>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<div className='space-y-2'>
						<Label htmlFor='name'>Guruh nomi *</Label>
						<Input
							id='name'
							placeholder='Masalan: Dasturlash kursi'
							value={name}
							onChange={e => setName(e.target.value)}
							required
							maxLength={100}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='desc'>Tavsif (ixtiyoriy)</Label>
						<Input
							id='desc'
							placeholder='Guruh haqida qisqacha...'
							value={description}
							onChange={e => setDescription(e.target.value)}
							maxLength={500}
						/>
					</div>
					<div className='flex gap-2 justify-end'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setOpen(false)}
						>
							Bekor
						</Button>
						<Button type='submit' disabled={!name.trim() || isLoading}>
							{isLoading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								'Yaratish'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
```

### Sidebar ga qo'shish

`Sidebar.tsx` dagi `{/* TODO (4-qadam) */}` qatorini:

```tsx
import { CreateGroupModal } from './CreateGroupModal'
// ...
;<CreateGroupModal />
```

### Tekshirish

```
✅ Sidebar dagi "+" tugmasiga bosing — modal ochilishi kerak
✅ Nom kiriting va Yaratish bosing — guruh Sidebar da paydo bo'lishi kerak
✅ Guruhga bosing — /chat/{id} ga o'tishi kerak
```

---

## QADAM 5 — Messages API va Store

### Backend endpointlari

| Method   | URL                             | Ma'lumot                            |
| -------- | ------------------------------- | ----------------------------------- |
| `GET`    | `/groups/{id}/messages`         | `?limit=50&offset=0&after={lastId}` |
| `POST`   | `/groups/{id}/messages`         | `{ "content": "Salom!" }`           |
| `DELETE` | `/groups/{id}/messages/{msgId}` | —                                   |

### Response tipi

```ts
// GET /groups/{id}/messages javob:
{
  messages: MessageResponse[],
  total: number
}

// MessageResponse:
{
  id: number,
  group_id: number,
  sender_id: number,
  content: string,
  created_at: string,
  sender: UserResponse   // kim yuborgan
}
```

### 5.1 — `api.ts` ga `messagesApi` qo'shish

`frontend/lib/api.ts` faylini oching va `// TODO (5-qadam)` qatoridan keyin qo'shing:

```ts
// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
	// Guruh xabarlarini olish
	// after parametri polling uchun: faqat shu ID dan keyingilarni qaytaradi
	getMessages: (
		groupId: number,
		params?: { limit?: number; offset?: number; after?: number },
	) =>
		api
			.get<MessageListResponse>(`/groups/${groupId}/messages`, { params })
			.then(r => r.data),

	// Xabar yuborish
	send: (groupId: number, data: MessageCreate) =>
		api
			.post<MessageResponse>(`/groups/${groupId}/messages`, data)
			.then(r => r.data),

	// Xabarni o'chirish (faqat o'z xabari yoki admin)
	delete: (groupId: number, messageId: number) =>
		api
			.delete<MessageOut>(`/groups/${groupId}/messages/${messageId}`)
			.then(r => r.data),
}
```

Import ham qo'shing (`types/index.ts` da hammasi tayyor):

```ts
import type {
	// ... mavjud importlar ...
	MessageCreate,
	MessageListResponse,
	MessageResponse,
} from '@/types'
```

### 5.2 — `chatStore.ts` ni kengaytirish

`frontend/store/chatStore.ts` faylini oching. `TODO` qatorlarini haqiqiy kod bilan almashtiring:

```ts
import { create } from 'zustand'
import { groupsApi, messagesApi } from '@/lib/api'
import type { GroupResponse, MessageResponse } from '@/types'

interface ChatState {
	// Guruhlar
	groups: GroupResponse[]
	isLoadingGroups: boolean
	fetchGroups: () => Promise<void>
	addGroup: (group: GroupResponse) => void
	removeGroup: (groupId: number) => void

	// Xabarlar
	messages: Record<number, MessageResponse[]> // { [groupId]: [...messages] }
	lastMessageId: Record<number, number> // { [groupId]: lastId }
	isLoadingMessages: boolean
	isSending: boolean
	activeGroupId: number | null

	setActiveGroup: (id: number | null) => void
	fetchMessages: (groupId: number) => Promise<void>
	pollMessages: (groupId: number) => Promise<void>
	sendMessage: (groupId: number, content: string) => Promise<void>
	deleteMessage: (groupId: number, messageId: number) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
	// ── Guruhlar ──────────────────────────────────────────────────────────────
	groups: [],
	isLoadingGroups: false,

	fetchGroups: async () => {
		set({ isLoadingGroups: true })
		try {
			const groups = await groupsApi.getMyGroups()
			set({ groups, isLoadingGroups: false })
		} catch {
			set({ isLoadingGroups: false })
		}
	},

	addGroup: group => set(s => ({ groups: [group, ...s.groups] })),
	removeGroup: id => set(s => ({ groups: s.groups.filter(g => g.id !== id) })),

	// ── Xabarlar ──────────────────────────────────────────────────────────────
	messages: {},
	lastMessageId: {},
	isLoadingMessages: false,
	isSending: false,
	activeGroupId: null,

	setActiveGroup: id => set({ activeGroupId: id }),

	// Birinchi marta xabarlarni yuklash (oxirgi 50 ta)
	fetchMessages: async groupId => {
		set({ isLoadingMessages: true })
		try {
			const res = await messagesApi.getMessages(groupId, { limit: 50 })
			const msgs = res.messages
			const last = msgs.length > 0 ? msgs[msgs.length - 1].id : 0
			set(s => ({
				messages: { ...s.messages, [groupId]: msgs },
				lastMessageId: { ...s.lastMessageId, [groupId]: last },
				isLoadingMessages: false,
			}))
		} catch {
			set({ isLoadingMessages: false })
		}
	},

	// Polling: har 3 soniyada yangi xabarlarni olish
	// "after" parametri: faqat shu ID dan keyin yuborilgan xabarlar qaytadi
	pollMessages: async groupId => {
		const after = get().lastMessageId[groupId]
		if (after === undefined) return
		try {
			const res = await messagesApi.getMessages(groupId, { after, limit: 50 })
			if (res.messages.length > 0) {
				const last = res.messages[res.messages.length - 1].id
				set(s => ({
					messages: {
						...s.messages,
						[groupId]: [...(s.messages[groupId] ?? []), ...res.messages],
					},
					lastMessageId: { ...s.lastMessageId, [groupId]: last },
				}))
			}
		} catch {
			// silent — polling xatosi critical emas
		}
	},

	// Xabar yuborish — optimistik UI (darhol store da paydo bo'ladi)
	sendMessage: async (groupId, content) => {
		set({ isSending: true })
		try {
			const msg = await messagesApi.send(groupId, { content })
			set(s => ({
				messages: {
					...s.messages,
					[groupId]: [...(s.messages[groupId] ?? []), msg],
				},
				lastMessageId: { ...s.lastMessageId, [groupId]: msg.id },
				isSending: false,
			}))
		} catch {
			set({ isSending: false })
			throw new Error('Xabar yuborishda xato')
		}
	},

	// Xabarni o'chirish — store dan darhol olib tashlanadi
	deleteMessage: async (groupId, messageId) => {
		await messagesApi.delete(groupId, messageId)
		set(s => ({
			messages: {
				...s.messages,
				[groupId]: (s.messages[groupId] ?? []).filter(m => m.id !== messageId),
			},
		}))
	},
}))
```

---

## QADAM 6 — Chat Sahifasi (`/chat/[groupId]`)

### Maqsad

Guruh chat oynasi: xabarlar ro'yxati, xabar yuborish, polling (yangi xabarlarni tekshirish).

### Arxitektura

```
ChatArea (asosiy komponent)
 ├── GroupHeader (guruh nomi, a'zolar soni)
 ├── MessageList (xabarlar ro'yxati)
 │    └── MessageItem (bitta xabar)
 └── MessageInput (xabar yozish)
```

### 6.1 — `MessageItem` komponenti

`frontend/components/chat/MessageItem.tsx`:

```tsx
'use client'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import type { MessageResponse } from '@/types'

interface Props {
	message: MessageResponse
	groupId: number
	isAdmin: boolean // guruh admini bo'lsa boshqalar xabarini ham o'chira oladi
}

export function MessageItem({ message, groupId, isAdmin }: Props) {
	const { deleteMessage } = useChatStore()
	const { user } = useAuthStore()

	const isOwn = message.sender_id === user?.id
	const canDelete = isOwn || isAdmin

	const handleDelete = async () => {
		if (!confirm("Xabarni o'chirishni tasdiqlaysizmi?")) return
		await deleteMessage(groupId, message.id)
	}

	return (
		<div className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
			{/* Avatar */}
			<div className='h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0'>
				{message.sender.username[0].toUpperCase()}
			</div>

			{/* Xabar */}
			<div
				className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
			>
				{!isOwn && (
					<p className='text-xs text-muted-foreground px-1'>
						{message.sender.username}
					</p>
				)}
				<div
					className={`relative rounded-xl px-4 py-2.5 text-sm ${
						isOwn
							? 'bg-primary text-primary-foreground rounded-tr-sm'
							: 'bg-muted rounded-tl-sm'
					}`}
				>
					<p className='whitespace-pre-wrap break-words'>{message.content}</p>
					{canDelete && (
						<Button
							size='icon'
							variant='ghost'
							className='absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 bg-background border border-border shadow-sm'
							onClick={handleDelete}
						>
							<Trash2 className='h-3 w-3' />
						</Button>
					)}
				</div>
				<p className='text-[10px] text-muted-foreground px-1'>
					{new Date(message.created_at).toLocaleTimeString('uz-UZ', {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</p>
			</div>
		</div>
	)
}
```

### 6.2 — `MessageInput` komponenti

`frontend/components/chat/MessageInput.tsx`:

```tsx
'use client'
import { useState, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chatStore'

export function MessageInput({ groupId }: { groupId: number }) {
	const { sendMessage, isSending } = useChatStore()
	const [content, setContent] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Textarea balandligini matn miqdoriga qarab o'zgartirish
	const adjustHeight = useCallback(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = 'auto'
		el.style.height = Math.min(el.scrollHeight, 120) + 'px'
	}, [])

	const handleSend = async () => {
		const text = content.trim()
		if (!text || isSending) return
		setContent('')
		if (textareaRef.current) textareaRef.current.style.height = 'auto'
		try {
			await sendMessage(groupId, text)
		} catch {
			setContent(text) // xato bo'lsa matnni qaytarish
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Enter — yuborish, Shift+Enter — yangi qator
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div className='flex items-end gap-2 p-4 border-t border-border bg-background'>
			<div className='flex-1'>
				<textarea
					ref={textareaRef}
					value={content}
					onChange={e => {
						setContent(e.target.value)
						adjustHeight()
					}}
					onKeyDown={handleKeyDown}
					placeholder='Xabar yozing... (Enter — yuborish, Shift+Enter — yangi qator)'
					rows={1}
					disabled={isSending}
					className='w-full resize-none rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors min-h-[40px] max-h-[120px] overflow-hidden'
				/>
			</div>
			<Button
				size='icon'
				onClick={handleSend}
				disabled={!content.trim() || isSending}
				className='h-10 w-10 rounded-xl shrink-0'
			>
				{isSending ? (
					<Loader2 className='h-4 w-4 animate-spin' />
				) : (
					<Send className='h-4 w-4' />
				)}
			</Button>
		</div>
	)
}
```

### 6.3 — `ChatArea` komponenti (asosiy)

`frontend/components/chat/ChatArea.tsx`:

```tsx
'use client'
import { useEffect, useRef, useCallback } from 'react'
import { Loader2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MessageItem } from './MessageItem'
import { MessageInput } from './MessageInput'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { groupsApi } from '@/lib/api'
import { useState } from 'react'
import type { GroupDetailResponse, GroupMemberResponse } from '@/types'

export function ChatArea({ groupId }: { groupId: number }) {
	const router = useRouter()
	const { user } = useAuthStore()
	const { messages, fetchMessages, pollMessages, setActiveGroup, removeGroup } =
		useChatStore()

	const [detail, setDetail] = useState<GroupDetailResponse | null>(null)
	const [members, setMembers] = useState<GroupMemberResponse[]>([])
	const [loading, setLoading] = useState(true)
	const scrollRef = useRef<HTMLDivElement>(null)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const groupMessages = messages[groupId] ?? []
	const myRole = members.find(m => m.user_id === user?.id)?.role
	const isAdmin = myRole === 'admin'

	// Guruh ma'lumotlari va xabarlarni yuklash
	const load = useCallback(async () => {
		setLoading(true)
		try {
			const [d, m] = await Promise.all([
				groupsApi.get(groupId),
				groupsApi.getMembers(groupId),
			])
			setDetail(d)
			setMembers(m)
		} catch {
			router.push('/chat') // guruh topilmasa asosiy chat ga qayt
		} finally {
			setLoading(false)
		}
	}, [groupId, router])

	useEffect(() => {
		setActiveGroup(groupId)
		load()
		fetchMessages(groupId)

		// Polling: har 3 soniyada yangi xabarlarni tekshirish
		intervalRef.current = setInterval(() => {
			pollMessages(groupId)
		}, 3000)

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			setActiveGroup(null)
		}
	}, [groupId, load, fetchMessages, pollMessages, setActiveGroup])

	// Yangi xabar kelganda pastga scroll
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [groupMessages])

	if (loading) {
		return (
			<div className='flex-1 flex items-center justify-center'>
				<Loader2 className='h-6 w-6 animate-spin text-primary' />
			</div>
		)
	}

	return (
		<div className='flex-1 flex flex-col min-h-0'>
			{/* Header */}
			<div className='flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0'>
				<div className='h-10 w-10 rounded-xl bg-violet-500 flex items-center justify-center text-white font-bold'>
					{detail?.name?.[0] ?? '?'}
				</div>
				<div className='flex-1 min-w-0'>
					<h2 className='font-semibold text-sm truncate'>{detail?.name}</h2>
					<p className='text-xs text-muted-foreground'>
						{detail?.member_count} a&apos;zo
						{detail?.description && ` • ${detail.description}`}
					</p>
				</div>
				<div className='flex items-center gap-1'>
					<span className='text-xs text-muted-foreground flex items-center gap-1'>
						<Users className='h-3.5 w-3.5' /> {members.length}
					</span>
				</div>
			</div>

			{/* Xabarlar */}
			<div
				ref={scrollRef}
				className='flex-1 overflow-y-auto px-4 py-4 space-y-3'
			>
				{groupMessages.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center'>
						<div className='h-16 w-16 rounded-2xl bg-violet-500 flex items-center justify-center text-white text-2xl font-bold mb-4'>
							{detail?.name?.[0] ?? '?'}
						</div>
						<h3 className='font-semibold'>{detail?.name}</h3>
						<p className='text-muted-foreground text-sm mt-1'>
							Bu guruhning boshlanishi. Birinchi xabarni yuboring!
						</p>
					</div>
				) : (
					groupMessages.map(msg => (
						<MessageItem
							key={msg.id}
							message={msg}
							groupId={groupId}
							isAdmin={isAdmin}
						/>
					))
				)}
			</div>

			{/* Xabar yozish */}
			<MessageInput groupId={groupId} />
		</div>
	)
}
```

### 6.4 — `app/chat/[groupId]/page.tsx`

```tsx
import { ChatArea } from '@/components/chat/ChatArea'

interface Props {
	params: Promise<{ groupId: string }>
}

export default async function GroupChatPage({ params }: Props) {
	const { groupId } = await params
	return <ChatArea groupId={Number(groupId)} />
}
```

### Tekshirish

```
✅ Guruhga bosing — xabarlar yuklanishi kerak
✅ Xabar yuboring — darhol ro'yxatda paydo bo'lishi kerak
✅ Boshqa brauzerda ham login qiling, xabar yuboring — 3 soniyada ko'rinishi kerak (polling)
✅ O'z xabaringizga hover qiling — o'chirish tugmasi paydo bo'lishi kerak
```

---

## QADAM 7 — Takliflar (Invitations)

### Backend endpointlari

| Method | URL                        | Tavsif                            |
| ------ | -------------------------- | --------------------------------- |
| `GET`  | `/invitations`             | Menga kelgan barcha takliflar     |
| `POST` | `/invitations/{id}/accept` | Taklifni qabul qilish             |
| `POST` | `/invitations/{id}/reject` | Taklifni rad etish                |
| `POST` | `/groups/{id}/invite`      | Username bo'yicha taklif yuborish |

### Response tipi

```ts
interface InvitationResponse {
	id: number
	group_id: number
	inviter_id: number
	invitee_id: number
	status: 'pending' | 'accepted' | 'rejected'
	created_at: string
	group: GroupResponse // qaysi guruhga taklif
	inviter: UserResponse // kim yuborgan
}
```

### 7.1 — `api.ts` ga `invitationsApi` qo'shish

`// TODO (7-qadam)` qatoridan keyin qo'shing:

```ts
// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitationsApi = {
	// Menga kelgan barcha takliflar (pending, accepted, rejected)
	getMyInvitations: () =>
		api.get<InvitationResponse[]>('/invitations').then(r => r.data),

	// Taklifni qabul qilish — guruhga qo'shiladi
	accept: (id: number) =>
		api.post<MessageOut>(`/invitations/${id}/accept`).then(r => r.data),

	// Taklifni rad etish
	reject: (id: number) =>
		api.post<MessageOut>(`/invitations/${id}/reject`).then(r => r.data),
}
```

Import qo'shing:

```ts
import type {
	// ... mavjud importlar ...
	InvitationResponse,
} from '@/types'
```

### 7.2 — `InviteModal` komponenti

Guruh a'zolarini taklif qilish.  
`frontend/components/chat/InviteModal.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { UserPlus, Search, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { groupsApi } from '@/lib/api'

export function InviteModal({ groupId }: { groupId: number }) {
	const [open, setOpen] = useState(false)
	const [username, setUsername] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
		null,
	)

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!username.trim()) return
		setIsLoading(true)
		setMessage(null)
		try {
			await groupsApi.invite(groupId, { username: username.trim() })
			setMessage({ text: `${username} ga taklif yuborildi!`, ok: true })
			setUsername('')
		} catch {
			setMessage({
				text: "Foydalanuvchi topilmadi yoki allaqachon a'zo",
				ok: false,
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size='sm' variant='ghost' className='gap-1.5 text-xs h-7'>
					<UserPlus className='h-3.5 w-3.5' /> Taklif
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-sm'>
				<DialogHeader>
					<DialogTitle>Guruhga taklif qilish</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleInvite} className='space-y-4 mt-2'>
					<div className='flex gap-2'>
						<Input
							placeholder='Username kiriting...'
							value={username}
							onChange={e => setUsername(e.target.value)}
							required
						/>
						<Button
							type='submit'
							size='icon'
							disabled={isLoading || !username.trim()}
						>
							{isLoading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Search className='h-4 w-4' />
							)}
						</Button>
					</div>
					{message && (
						<p
							className={`text-sm flex items-center gap-1.5 ${message.ok ? 'text-green-600' : 'text-destructive'}`}
						>
							{message.ok && <Check className='h-3.5 w-3.5' />}
							{message.text}
						</p>
					)}
				</form>
			</DialogContent>
		</Dialog>
	)
}
```

### 7.3 — `/chat/invitations` sahifasi

`frontend/app/chat/invitations/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Bell, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { invitationsApi } from '@/lib/api'
import { useChatStore } from '@/store/chatStore'
import type { InvitationResponse } from '@/types'

export default function InvitationsPage() {
	const { addGroup, fetchGroups } = useChatStore()
	const [invitations, setInvitations] = useState<InvitationResponse[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [processingId, setProcessingId] = useState<number | null>(null)

	useEffect(() => {
		invitationsApi
			.getMyInvitations()
			.then(setInvitations)
			.finally(() => setIsLoading(false))
	}, [])

	const pending = invitations.filter(i => i.status === 'pending')
	const others = invitations.filter(i => i.status !== 'pending')

	const handleAccept = async (inv: InvitationResponse) => {
		setProcessingId(inv.id)
		try {
			await invitationsApi.accept(inv.id)
			setInvitations(prev =>
				prev.map(i =>
					i.id === inv.id ? { ...i, status: 'accepted' as const } : i,
				),
			)
			addGroup(inv.group) // Sidebar da darhol guruh paydo bo'ladi
			await fetchGroups() // Store ni yangilash
		} finally {
			setProcessingId(null)
		}
	}

	const handleReject = async (inv: InvitationResponse) => {
		setProcessingId(inv.id)
		try {
			await invitationsApi.reject(inv.id)
			setInvitations(prev =>
				prev.map(i =>
					i.id === inv.id ? { ...i, status: 'rejected' as const } : i,
				),
			)
		} finally {
			setProcessingId(null)
		}
	}

	return (
		<div className='flex-1 flex flex-col min-h-0'>
			{/* Sarlavha */}
			<div className='flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0'>
				<Bell className='h-5 w-5 text-primary' />
				<h1 className='font-semibold'>Takliflar</h1>
				{pending.length > 0 && <Badge>{pending.length}</Badge>}
			</div>

			<div className='flex-1 overflow-y-auto p-6'>
				<div className='max-w-lg mx-auto space-y-6'>
					{isLoading ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='h-6 w-6 animate-spin text-primary' />
						</div>
					) : pending.length === 0 && others.length === 0 ? (
						<div className='text-center py-12'>
							<Bell className='h-12 w-12 mx-auto mb-4 text-muted-foreground/30' />
							<p className='text-muted-foreground'>Hali takliflar yo&apos;q</p>
							<p className='text-sm text-muted-foreground/60 mt-1'>
								Kimdir sizni guruhga taklif qilganda shu yerda ko&apos;rinadi
							</p>
						</div>
					) : (
						<>
							{pending.length > 0 && (
								<section>
									<h2 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
										Kutilmoqda ({pending.length})
									</h2>
									<div className='space-y-2'>
										{pending.map(inv => (
											<Card key={inv.id}>
												<CardContent className='pt-4 pb-4'>
													<div className='flex items-start gap-3'>
														<div className='h-10 w-10 rounded-xl bg-violet-500 flex items-center justify-center text-white font-bold shrink-0'>
															{inv.group.name[0].toUpperCase()}
														</div>
														<div className='flex-1 min-w-0'>
															<p className='font-semibold text-sm'>
																{inv.group.name}
															</p>
															{inv.group.description && (
																<p className='text-xs text-muted-foreground truncate'>
																	{inv.group.description}
																</p>
															)}
															<p className='text-xs text-muted-foreground mt-1'>
																<strong>{inv.inviter.username}</strong> taklif
																qildi
															</p>
														</div>
													</div>
													<div className='flex gap-2 mt-3'>
														<Button
															size='sm'
															className='flex-1 h-8'
															onClick={() => handleAccept(inv)}
															disabled={processingId === inv.id}
														>
															{processingId === inv.id ? (
																<Loader2 className='h-3.5 w-3.5 animate-spin' />
															) : (
																<>
																	<Check className='h-3.5 w-3.5' /> Qabul
																</>
															)}
														</Button>
														<Button
															size='sm'
															variant='outline'
															className='flex-1 h-8'
															onClick={() => handleReject(inv)}
															disabled={processingId === inv.id}
														>
															<X className='h-3.5 w-3.5' /> Rad
														</Button>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</section>
							)}

							{others.length > 0 && (
								<section>
									<h2 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
										Tarix
									</h2>
									<div className='space-y-2 opacity-60'>
										{others.map(inv => (
											<Card key={inv.id}>
												<CardContent className='py-3 px-4 flex items-center gap-3'>
													<div className='h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0'>
														{inv.group.name[0].toUpperCase()}
													</div>
													<p className='text-sm flex-1 truncate'>
														{inv.group.name}
													</p>
													<Badge
														variant={
															inv.status === 'accepted'
																? 'default'
																: 'destructive'
														}
														className='text-[10px]'
													>
														{inv.status === 'accepted' ? 'Qabul' : 'Rad'}
													</Badge>
												</CardContent>
											</Card>
										))}
									</div>
								</section>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}
```

### Tekshirish

```
✅ Guruh yarating va boshqa foydalanuvchiga taklif yuboring
✅ Boshqa foydalanuvchi /chat/invitations ga kirsin — taklif ko'rinishi kerak
✅ "Qabul" ni bossin — guruh Sidebar da paydo bo'lishi kerak
✅ "Rad" ni bossin — tarix bo'limiga o'tishi kerak
```

---

## 📋 Yakuniy tekshiruv ro'yxati

Barcha qadamlar bajarilganidan so'ng:

- [ ] `/login` — login ishlaydi, `/chat` ga o'tadi
- [ ] `/register` — register ishlaydi, `/chat` ga o'tadi
- [ ] `/chat` ga token bo'lmay kirish → `/login` ga redirect
- [ ] Login holida `/login` ga kirish → `/chat` ga redirect
- [ ] `/chat` — Sidebar bilan welcome sahifa
- [ ] Guruh yaratish — Sidebar da ko'rinadi
- [ ] `/chat/{id}` — xabarlar, polling, yuborish, o'chirish
- [ ] `/profile` — profil ko'rish va tahrirlash
- [ ] `/chat/invitations` — takliflar va qabul/rad
- [ ] Guruhdan taklif yuborish — InviteModal ishlaydi
- [ ] Logout — `/login` ga qaytadi

---

## 💡 Qo'shimcha vazifalar (qo'llanmadan tashqari)

Asosiy qadamlar tugagandan keyin quyidagilarni mustaqil amalga oshirishingiz mumkin:

**Oson:**

- Guruh qidirish — Sidebar da `input` va `groups.filter()`
- Xabar vaqtini to'liq formatda ko'rsatish (`toLocaleString`)
- Avatar URL bilan profilni ko'rsatish (`<img>` tegi)

**O'rta:**

- Polling faqat tab aktiv bo'lganda — `document.visibilityState`
- Axios response interceptor — 401 xatolikda auto logout
- O'qilmagan xabarlar badge — Sidebar da guruh yonida raqam

**Murakkab:**

- WebSocket — polling o'rniga real-time
- Eski xabarlarni yuklash — `IntersectionObserver` + `offset` parametri
- Xabar tahrirlash — `PUT /groups/{id}/messages/{msgId}`
- Parol o'zgartirish — `PUT /users/me/password`

---

_Omad! Savollar bo'lsa, har bir qadam oxiridagi tekshiruv ro'yxatiga qarang._

# Keyingi ishlar

# 1. Response
# 2. SEO qilish kerak app layoutda guruh chat ilovasi metadata 
# 3. Reply Bekend uzgarsa qoshish kerak
# 4. Dizaynni togirlash deploy
# 5. admin bohqalarni xabarini ham uchira olishi kerak
# 6. avatarni togirlash kerak