
export interface UserResponseDTO {
  id: number
  username: string
  roleName: string
  isActive: boolean
  isAdmin: boolean
  createdAt: string
}

export interface AdminUpdateDTO {
  id: number
  roleName: string
  isActive: boolean
}

export interface UpdateUserDTO {
  id: number
  username: string
  password: string
}
