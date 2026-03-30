import { useState, useEffect, type FormEvent } from "react"
import { useAuthStore } from "../../stores/authStore"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Badge } from "../../components/ui/Badge"
import { UserCircle, Key, Upload } from "lucide-react"
import api from "../../lib/api"
import type { ApiResponse, User } from "../../lib/types"
import toast from "react-hot-toast"

export function ProfilePage() {
  const { user, setUser, fetchProfile } = useAuthStore()
  const [fullName, setFullName] = useState("")
  const [saving, setSaving] = useState(false)

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "")
    }
  }, [user])

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put<ApiResponse<User>>("/api/me", { full_name: fullName })
      if (res.data.success && res.data.data) {
        setUser(res.data.data)
        toast.success("Profile updated")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setChangingPassword(true)
    try {
      const res = await api.put<ApiResponse>("/api/me/password", {
        old_password: oldPassword,
        new_password: newPassword,
      })
      if (res.data.success) {
        toast.success("Password changed")
        setOldPassword("")
        setNewPassword("")
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    setUploading(true)
    try {
      const res = await api.post<ApiResponse>("/api/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      if (res.data.success) {
        toast.success("Avatar uploaded")
        await fetchProfile()
      } else {
        toast.error(res.data.message)
      }
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-6 text-cyber-green">Profile</h2>

      {/* User Info */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-16 h-16 rounded border border-border object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded border border-border bg-bg-hover flex items-center justify-center">
                <UserCircle size={32} className="text-cyber-green-muted" />
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded">
              {uploading ? (
                <span className="h-4 w-4 animate-spin border-2 border-cyber-green border-t-transparent rounded-full" />
              ) : (
                <Upload size={16} className="text-cyber-green" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="text-lg font-bold text-cyber-green">{user.username}</p>
            <p className="text-sm text-cyber-green-muted">{user.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant={user.is_active ? "success" : "danger"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="info">{user.role}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle size={16} className="text-cyber-green-dim" />
          <h3 className="text-sm font-bold text-cyber-green-dim uppercase tracking-wider">
            Edit Profile
          </h3>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input label="Username" value={user.username} disabled />
          <Input label="Email" value={user.email} disabled />
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
          />
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-cyber-green-dim" />
          <h3 className="text-sm font-bold text-cyber-green-dim uppercase tracking-wider">
            Change Password
          </h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
          <Button type="submit" loading={changingPassword} variant="outline">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  )
}
