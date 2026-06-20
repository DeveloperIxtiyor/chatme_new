"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/chat/Sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Agar /chat/[id] ko'rinishida bo'lsak — demak foydalanuvchi
  // biror guruh ichida. Telefonda shu holatda Sidebar yashiriladi,
  // faqat ChatArea (orqaga qaytish tugmasi bilan) ko'rsatiladi.
  const isInsideGroup = /^\/chat\/[^/]+$/.test(pathname || "")

  return (
    <div className="h-screen bg-background">
      {/* Desktop va planshet */}
      <div className="hidden md:flex h-full">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Telefon */}
      <div className="flex md:hidden h-full">
        {isInsideGroup ? (
          <main className="flex-1 min-w-0">
            {children}
          </main>
        ) : (
          <Sidebar />
        )}
      </div>
    </div>
  )
}