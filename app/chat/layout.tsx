import { Sidebar } from "@/components/chat/Sidebar"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}