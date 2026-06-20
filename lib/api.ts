	import type {
		GroupCreate,
		GroupDetailResponse,
		GroupMemberResponse,
		GroupResponse,
		GroupUpdate,
		InviteRequest,
		LoginRequest,
		MessageOut,
		RegisterRequest,
		TokenResponse,
		UserResponse,
		UserUpdate,
	} from '@/types'
	import axios from 'axios'

	const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

	export const api = axios.create({
		baseURL: BASE_URL,
		headers: {
			'Content-Type': 'application/json',
			'ngrok-skip-browser-warning': 'true',
		},
	})

	// Token interceptor — har bir so'rovga Authorization header qo'shadi
	api.interceptors.request.use(config => {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('access_token')
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
		}
		return config
	})

	// ─── Auth ────────────────────────────────────────────────────────────────────
	export const authApi = {
		register: (data: RegisterRequest) =>
			api.post<UserResponse>('/auth/register', data).then(r => r.data),
		login: (data: LoginRequest) =>
			api.post<TokenResponse>('/auth/login', data).then(r => r.data),
	}

	// ─── Users ───────────────────────────────────────────────────────────────────
	export const usersApi = {
		// O'z profilimni olish
		getMe: () => api.get<UserResponse>('/users/me').then(r => r.data),
		// Profilni yangilash (bio, avatar URL)
		updateMe: (data: UserUpdate) =>
			api.put<UserResponse>('/users/me', data).then(r => r.data),
		// Username bo'yicha qidirish
		search: (q: string) =>
			api.get<UserResponse[]>('/users/search', { params: { q } }).then(r => r.data),
		// Username bo'yicha boshqa foydalanuvchini ko'rish
		getByUsername: (username: string) =>
			api.get<UserResponse>(`/users/${username}`).then(r => r.data),
	}

	// ─── Groups ──────────────────────────────────────────────────────────────────
	export const groupsApi = {
		// A'zo bo'lgan barcha guruhlarim
		getMyGroups: () => api.get<GroupResponse[]>('/groups').then(r => r.data),
		// Yangi guruh yaratish
		create: (data: GroupCreate) =>
			api.post<GroupResponse>('/groups', data).then(r => r.data),
		// Guruh ma'lumotlari (egasi, a'zolar soni bilan)
		get: (groupId: number) =>
			api.get<GroupDetailResponse>(`/groups/${groupId}`).then(r => r.data),
		// Guruhni yangilash (faqat admin)
		update: (groupId: number, data: GroupUpdate) =>
			api.put<GroupResponse>(`/groups/${groupId}`, data).then(r => r.data),
		// Guruhni o'chirish (faqat egasi)
		delete: (groupId: number) =>
			api.delete<MessageOut>(`/groups/${groupId}`).then(r => r.data),
		// Guruh a'zolari ro'yxati
		getMembers: (groupId: number) =>
			api.get<GroupMemberResponse[]>(`/groups/${groupId}/members`).then(r => r.data),
		// Guruhdan chiqish
		leave: (groupId: number) =>
			api.post<MessageOut>(`/groups/${groupId}/leave`).then(r => r.data),
		// A'zoni guruhdan chiqarish (faqat admin)
		kickMember: (groupId: number, userId: number) =>
			api.delete<MessageOut>(`/groups/${groupId}/kick/${userId}`).then(r => r.data),
		// Username bo'yicha taklif yuborish
		invite: (groupId: number, data: InviteRequest) =>
			api.post<MessageOut>(`/groups/${groupId}/invite`, data).then(r => r.data),
	}

	// ─── Messages ─────────────────────────────────────────────────────────────────
	export const messagesApi = {
		// Guruhga tegishli barcha xabarlarni yuklab olish
		// DIQQAT: Endpoint aynan /groups/{id}/messages ko'rinishida bo'lishi kerak!
		getByGroup: (groupId: number) =>
			api.get<any[]>(`/groups/${groupId}/messages`, { params: { limit: 50 } }).then(r => r.data),

		// Guruhga yangi xabar yuborish
		send: (groupId: number, content: string) =>
			api.post<any>(`/groups/${groupId}/messages`, { content }).then(r => r.data),

		// Xabarni o'chirish
		delete: (groupId: number, messageId: number) =>
			api.delete<any>(`/groups/${groupId}/messages/${messageId}`).then(r => r.data),
	}


	// ─── Invitations ──────────────────────────────────────────────────────────────
	export const invitationsApi = {
		// Menga kelgan barcha taklifnomalarni olish
		getMyInvitations: () =>
			api.get<any[]>('/invitations').then(r => r.data),

		// Taklifnomani qabul qilish
		accept: (id: number) =>
			api.post<any>(`/invitations/${id}/accept`).then(r => r.data),

		// Taklifnomani rad etish
		reject: (id: number) =>
			api.post<any>(`/invitations/${id}/reject`).then(r => r.data),
	}
