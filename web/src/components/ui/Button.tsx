import type { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-mono font-medium transition-all duration-200 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-cyber-green/10 text-cyber-green border-cyber-green/30 hover:bg-cyber-green/20 hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]",
    danger:
      "bg-cyber-danger/10 text-cyber-danger border-cyber-danger/30 hover:bg-cyber-danger/20 hover:shadow-[0_0_15px_rgba(255,0,64,0.3)]",
    ghost:
      "bg-transparent text-cyber-green-muted border-transparent hover:bg-bg-hover hover:text-cyber-green",
    outline:
      "bg-transparent text-cyber-green border-border hover:border-cyber-green/30 hover:bg-cyber-green/5",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}
