import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import toast from "react-hot-toast"

export function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(username, email, password, fullName || undefined)
      toast.success("Account created")
      navigate("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyber-green tracking-wider">
            Charon
          </h1>
          <p className="text-xs text-cyber-green-muted mt-2 uppercase tracking-[0.3em]">
            New Agent Registration
          </p>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyber-green/30 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card border border-border p-6 space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="agent_smith"
            autoFocus
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@charon.dev"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-cyber-green-muted mt-4">
          Already registered?{" "}
          <Link to="/login" className="text-cyber-green hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
