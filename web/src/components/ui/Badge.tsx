import type { ReactNode } from "react"

interface BadgeProps {
  variant?: "success" | "danger" | "warning" | "muted" | "info"
  children: ReactNode
  className?: string
}

export function Badge({ variant = "muted", children, className = "" }: BadgeProps) {
  const variants = {
    success: "bg-cyber-green/10 text-cyber-green border-cyber-green/30",
    danger: "bg-cyber-danger/10 text-cyber-danger border-cyber-danger/30",
    warning: "bg-cyber-warning/10 text-cyber-warning border-cyber-warning/30",
    muted: "bg-bg-hover text-cyber-green-muted border-border",
    info: "bg-cyber-green-dim/10 text-cyber-green-dim border-cyber-green-dim/30",
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
