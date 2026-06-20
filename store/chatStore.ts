import { create } from 'zustand'
import { groupsApi, messagesApi } from '@/lib/api'
import type { GroupResponse, MessageResponse } from '@/types'

// Вспомогательная функция для безопасного извлечения чистого массива сообщений
const getSafeMessagesArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.messages)) return data.messages;
    if (Array.isArray(data.data)) return data.data;
  }
  return [];
};

interface ChatState {
  groups: GroupResponse[]
  isLoadingGroups: boolean
  messages: Record<number, any[]>
  isLoadingMessages: boolean
  isSending: boolean
  activeGroupId: number | null

  fetchGroups: () => Promise<void>
  addGroup: (group: GroupResponse) => void
  removeGroup: (groupId: number) => void
  setActiveGroup: (id: number | null) => void
  fetchMessages: (groupId: number) => Promise<void>
  pollMessages: (groupId: number) => Promise<void>
  sendMessage: (groupId: number, content: string) => Promise<void>
  deleteMessage: (groupId: number, messageId: number) => Promise<void>
  leaveGroup: (groupId: number) => Promise<void>
  kickMember: (groupId: number, userId: number) => Promise<void>
  addMessage: (groupId: number, message: any) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  groups: [],
  isLoadingGroups: false,
  messages: {},
  isLoadingMessages: false,
  isSending: false,
  activeGroupId: null,

  fetchGroups: async () => {
    set({ isLoadingGroups: true })
    try {
      const groups = await groupsApi.getMyGroups()
      set({ groups, isLoadingGroups: false })
    } catch {
      set({ isLoadingGroups: false })
    }
  },

  addGroup: group =>
    set(state => ({ groups: [group, ...state.groups] })),

  removeGroup: groupId =>
    set(state => ({
      groups: state.groups.filter(g => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
    })),

  setActiveGroup: id => set({ activeGroupId: id }),

  fetchMessages: async (groupId) => {
    set({ isLoadingMessages: true })
    try {
      const responseData = await messagesApi.getByGroup(groupId)
      const cleanMessages = getSafeMessagesArray(responseData)
      set(state => ({
        messages: { ...state.messages, [groupId]: cleanMessages },
        isLoadingMessages: false
      }))
    } catch {
      set({ isLoadingMessages: false })
    }
  },

  pollMessages: async (groupId) => {
    try {
      const responseData = await messagesApi.getByGroup(groupId)
      const cleanMessages = getSafeMessagesArray(responseData)
      set(state => ({
        messages: { ...state.messages, [groupId]: cleanMessages }
      }))
    } catch (error) {
      console.error("Polling vaqtida xatolik:", error)
    }
  },

  sendMessage: async (groupId, content) => {
    set({ isSending: true })
    try {
      const newMsg = await messagesApi.send(groupId, content)
      set(state => {
        const currentMsgs = getSafeMessagesArray(state.messages[groupId])

        // Защита от дубликатов
        if (currentMsgs.some(m => m.id === newMsg.id)) {
          return { isSending: false }
        }

        return {
          messages: { ...state.messages, [groupId]: [...currentMsgs, newMsg] },
          isSending: false
        }
      })
    } catch (error) {
      set({ isSending: false })
      throw error
    }
  },

  deleteMessage: async (groupId, messageId) => {
    try {
      await messagesApi.delete(groupId, messageId)
      set(state => {
        const currentMsgs = getSafeMessagesArray(state.messages[groupId])
        return {
          messages: {
            ...state.messages,
            // ID turi String yoki Number bo'lishidan qat'iy nazar Telegramdek silliq o'chiradi
            [groupId]: currentMsgs.filter(m => String(m.id) !== String(messageId))
          }
        }
      })
    } catch (error) {
      console.error("Xabarni o'chirishda xatolik:", error)
      throw error
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await groupsApi.leave(groupId)
      set(state => ({
        groups: state.groups.filter(g => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
      }))
    } catch (error) {
      console.error("Guruhdan chiqishda xato:", error)
      throw error
    }
  },

  kickMember: async (groupId, userId) => {
    try {
      await groupsApi.kickMember(groupId, userId)
    } catch (error) {
      console.error("A'zoni chiqarishda xato:", error)
      throw error
    }
  },

  addMessage: (groupId, message) => set((state) => {
    const currentMsgs = getSafeMessagesArray(state.messages[groupId])
    if (currentMsgs.some(m => m.id === message.id)) return state

    return {
      messages: {
        ...state.messages,
        [groupId]: [...currentMsgs, message]
      }
    }
  })
}))
