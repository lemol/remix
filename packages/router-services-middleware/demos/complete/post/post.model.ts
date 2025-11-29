export interface Post {
  id: number
  title: string
  content: string
  authorId: number
}

export interface PostRepository {
  listPosts(): Promise<Post[]>
  getPost(id: number): Promise<Post | undefined>
  createPost(post: Omit<Post, 'id'>): Promise<Post>
}
