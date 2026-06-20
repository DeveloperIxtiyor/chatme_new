import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarColor(id: number): string {
  const colors = [
    'bg-avatar-blue', 'bg-avatar-orange', 'bg-avatar-teal',
    'bg-avatar-amber', 'bg-avatar-green', 'bg-avatar-pink',
    'bg-avatar-purple',
  ]
  return colors[id % colors.length]
}

export function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') {
    return '?'
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}