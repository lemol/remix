import { users, posts } from "./db";
import type { UserRepository } from "../user/user.model";
import type { Post, PostRepository } from "../post/post.model";

export class MemoryUserRepository implements UserRepository {
  listUsers() {
    return Promise.resolve(users)
  }

  updateUserPostCount(userId: number) {
    let user = users.find(user => user.id === userId)
    if (user) {
      user.postCount++
    }
    return Promise.resolve()
  }
}

export class MemoryPostRepository implements PostRepository {
  listPosts() {
    return Promise.resolve(posts)
  }

  createPost(post: Omit<Post, "id">) {
    let newPost = {
      id: posts.length + 1,
      ...post,
    }
    posts.push(newPost)
    return Promise.resolve(newPost)
  }
}
