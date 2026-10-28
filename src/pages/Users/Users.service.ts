import { api } from "../../services/api"
import type { UserResponseDTO , UpdateUserDTO, AdminUpdateDTO } from "../../types/user.type"


export const userService = {
  // GET: api/Users
  async getAll(): Promise<UserResponseDTO[]> {
    const response = await api.get<UserResponseDTO[]>("/Users")
    return response.data
  },

  // GET: api/Users/{id}
  async getById(id: number): Promise<UserResponseDTO> {
    const response = await api.get<UserResponseDTO>(`/Users/${id}`)
    return response.data
  },

  // GET: api/Users/me
  async getMyProfile(): Promise<UserResponseDTO> {
    const response = await api.get<UserResponseDTO>("/Users/me")
    return response.data
  },

  // PUT: api/Users/me
  async updateMyProfile(data: UpdateUserDTO): Promise<UserResponseDTO> {
    const response = await api.put<UserResponseDTO>("/Users/me", data)
    return response.data
  },

  // PUT: api/Users/admin
  async adminUpdate(data: AdminUpdateDTO): Promise<UserResponseDTO> {
    const response = await api.put<UserResponseDTO>("/Users/admin", data)
    return response.data
  },

  // DELETE: api/Users/{id}
  async delete(id: number): Promise<void> {
    await api.delete(`/Users/${id}`)
  },
}