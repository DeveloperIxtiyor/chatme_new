'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { getAvatarColor, getInitials } from '@/lib/utils'

export default function ChatPage() {
  const { groups, fetchGroups } = useChatStore()

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return (
    <>
      {/* Telefon */}
      <div className="md:hidden h-screen overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Guruhlar</h1>
        </div>

        <div className="p-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/chat/${group.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent"
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(group.id)}`}
              >
                {getInitials(group.name)}
              </div>

              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-2">
          ChatMe&apos;ga xush kelibsiz!
        </h2>

        <p className="text-muted-foreground max-w-sm">
          Chap tarafdagi guruhlardan birini tanlang yoki yangi guruh yarating.
        </p>
      </div>
    </>
  )
}