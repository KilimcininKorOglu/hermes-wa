import type { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className = "", glow }: CardProps) {
  return (
    <div
      className={`bg-bg-card border border-border p-4 ${glow ? "border-cyber-green/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]" : ""} ${className}`}
    >
      {children}
    </div>
  )
}
