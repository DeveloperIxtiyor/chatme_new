"use client"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppTheme } from "@/components/shared/providers"

export function ThemeToggle() {
  const { theme, setTheme } = useAppTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="h-8 w-8"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
