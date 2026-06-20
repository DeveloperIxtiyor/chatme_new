import { authApi, usersApi } from '@/lib/api'
import type { LoginRequest, RegisterRequest, UserResponse } from '@/types'
import { create } from 'zustand'

interface AuthState {
	user: UserResponse | null
	isLoading: boolean
	error: string | null

	login: (data: LoginRequest) => Promise<void>
	register: (data: RegisterRequest) => Promise<void>
	logout: () => void
	fetchMe: () => Promise<void>
	clearError: () => void
	setUser: (user: UserResponse) => void
}

export const useAuthStore = create<AuthState>(set => ({
	user: null,
	isLoading: false,
	error: null,

	login: async data => {
		set({ isLoading: true, error: null })
		try {
			const tokenRes = await authApi.login(data)
			localStorage.setItem('access_token', tokenRes.access_token)
			document.cookie = `access_token=${tokenRes.access_token}; path=/`
			const user = await usersApi.getMe()
			set({ user, isLoading: false })
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { detail?: string } } })?.response?.data
					?.detail || 'Login muvaffaqiyatsiz'
			set({ error: msg, isLoading: false })
			throw err
		}
	},

	register: async data => {
		set({ isLoading: true, error: null })
		try {
			await authApi.register(data)
			const tokenRes = await authApi.login({
				username: data.username,
				password: data.password,
			})
			localStorage.setItem('access_token', tokenRes.access_token)
			document.cookie = `access_token=${tokenRes.access_token}; path=/`
			const user = await usersApi.getMe()
			set({ user, isLoading: false })
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { detail?: string } } })?.response?.data
					?.detail || "Ro'yxatdan o'tish muvaffaqiyatsiz"
			set({ error: msg, isLoading: false })
			throw err
		}
	},

	logout: () => {
		localStorage.removeItem('access_token')
		document.cookie = 'access_token=; path=/; max-age=0'
		set({ user: null })
	},

	fetchMe: async () => {
		const token = localStorage.getItem('access_token')
		if (!token) throw new Error('No token')
		const user = await usersApi.getMe()
		set({ user })
	},

	clearError: () => set({ error: null }),
	setUser: user => set({ user }),
}))
