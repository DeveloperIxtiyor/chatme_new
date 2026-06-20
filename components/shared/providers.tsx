"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ToastProvider, ToastViewport } from "@/components/ui/toast"

type ThemeMode = "light" | "dark"
interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useAppTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useAppTheme must be used within Providers")
  }
  return context
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const preferredDark = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
    const initial = stored === "light" || stored === "dark" ? stored : preferredDark ? "dark" : "light"
    setTheme(initial)
    document.documentElement.classList.toggle("dark", initial === "dark")
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    </ThemeContext.Provider>
  )
}
