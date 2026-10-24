
import axios from "axios"

const TOKEN_STORAGE_KEY = "authToken"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5037/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function storeAuthToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
