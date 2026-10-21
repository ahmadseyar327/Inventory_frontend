import type { UserResponse } from "./user.type"

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface RegisterRequest {
  username: string
  password: string
}