
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../../types/auth.types"
import { api, storeAuthToken } from "../../services/api"

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      credentials,
    )

    storeAuthToken(response.data.token)
    return response.data
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post("/auth/register", data)
  },
}
