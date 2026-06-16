"use client"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageCircle, Users, Bell, LogOut, User, Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { CreateGroupModal } from "@/components/chat/CreateGroupModal"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"
import { getAvatarColor, getInitials, cn } from "@/lib/utils"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    router.push("/login")
  }

  const activeGroupId = pathname.match(/\/chat\/(\d+)/)?.[1]

  return (
    <div className="w-64 flex flex-col h-dvh overflow-hidden border-r border-border bg-card shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
          ChatMe
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>

      {/* Nav icons */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        <Link href="/chat" className={cn(
          "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
          !activeGroupId && pathname === "/chat"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}>
          <Users className="h-3.5 w-3.5" /> Guruhlar
        </Link>
        <Link href="/chat/invitations" className={cn(
          "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
          pathname === "/chat/invitations"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}>
          <Bell className="h-3.5 w-3.5" /> Takliflar
        </Link>
      </div>

      {/* Groups list */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Guruhlarim
        </span>
        <CreateGroupModal />
      </div>

      <ScrollArea className="h-0 flex-1 px-2">
        {isLoadingGroups ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground px-4">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Hali guruhlar yo&apos;q</p>
            <p className="text-xs mt-1">Yangi guruh yarating yoki taklif kuting</p>
          </div>
        ) : (
          <div className="space-y-0.5 pb-2">
            {groups.map((group) => {
              const isActive = activeGroupId === String(group.id)
              return (
                <Link key={group.id} href={`/chat/${group.id}`}>
                  <div className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-foreground"
                  )}>
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0",
                      group.avatar ? "" : getAvatarColor(group.id)
                    )}>
                      {group.avatar
                        ? <img src={group.avatar} alt={group.name} className="h-9 w-9 rounded-xl object-cover" />
                        : getInitials(group.name)
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </ScrollArea>

      

      <Separator />

      {/* User section */}
      <div className="p-3 mt-auto border-t border-border bg-card">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent transition-colors">
              <UserAvatar username={user?.username || "?"} avatar={user?.avatar} id={user?.id} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
  side="top"
  align="center"
  sideOffset={8}
  className="w-56 mb-2"
>
            <DropdownMenuLabel className="text-xs">{user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="h-4 w-4" /> Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" /> Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
