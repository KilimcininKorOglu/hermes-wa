import type { InputHTMLAttributes } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs text-cyber-green-dim uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-bg-input border border-border text-cyber-green placeholder-cyber-green-muted/50 px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyber-green/50 focus:shadow-[0_0_10px_rgba(0,255,65,0.15)] transition-all ${error ? "border-cyber-danger/50" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-cyber-danger">{error}</span>}
    </div>
  )
}
