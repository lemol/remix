export interface User {
  id: number
  name: string
  postCount: number
}

export interface UserRepository {
  listUsers(): Promise<User[]>
  updateUserPostCount(userId: number): Promise<void>
}
