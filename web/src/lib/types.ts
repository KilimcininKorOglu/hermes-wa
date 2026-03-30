// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    details: string
  }
}

// Auth
export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  auth_provider: string
  role: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  last_login_at?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

// Instance
export interface Instance {
  instanceId: string
  status: string
  circle: string
  description: string
  used: boolean
  jid: string
  phoneNumber: string
  connected: boolean
}

// Warming
export interface WarmingRoom {
  id: string
  name: string
  senderInstanceId: string
  receiverInstanceId?: string
  scriptId: number
  roomType: "BOT_VS_BOT" | "HUMAN_VS_BOT"
  status: "STOPPED" | "ACTIVE" | "PAUSE" | "FINISHED"
  currentSequence: number
  intervalMinSeconds: number
  intervalMaxSeconds: number
  nextRunAt?: string
  lastRunAt?: string
  aiEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface WarmingScript {
  id: number
  title: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface WarmingLog {
  id: string
  roomId: string
  status: string
  message: string
  timestamp: string
}

// Worker
export interface WorkerConfig {
  id: number
  user_id: number
  worker_name: string
  circle: string
  application: string
  message_type: string
  interval_seconds: number
  interval_max_seconds: number
  enabled: boolean
  allow_media: boolean
  webhook_url?: string
  webhook_secret?: string
  created_at: string
  updated_at: string
}

// Admin
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalInstances: number
  connectedInstances: number
  activeWarmingRooms: number
  activeWorkers: number
}

export interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  limit: number
}

// Files
export interface FileEntry {
  name: string
  path: string
  isDir: boolean
  size?: number
  modTime: string
}

// WebSocket
export interface WsEvent {
  event: string
  timestamp: string
  data: unknown
}
