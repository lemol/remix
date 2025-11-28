import type { User } from "../user/user.model";

export const users: User[] = [
  { id: 1, name: 'Sarah Chen', postCount: 3 },
  { id: 2, name: 'Marcus Rodriguez', postCount: 2 },
  { id: 3, name: 'Aisha Patel', postCount: 1 },
  { id: 4, name: 'Jake Thompson', postCount: 2 },
  { id: 5, name: 'Elena Kowalski', postCount: 1 },
]

export const posts: Post[] = [
  { 
    id: 1, 
    title: 'Building Type-Safe APIs with TypeScript', 
    content: 'In this article, I explore how TypeScript transforms API development by catching errors at compile time. We\'ll look at practical patterns for router middleware and type inference that make your code safer and more maintainable.',
    authorId: 1 
  },
  { 
    id: 2, 
    title: 'My Journey Learning Rust: Week 1', 
    content: 'Coming from JavaScript, Rust\'s ownership model seemed intimidating. But after a week of hands-on practice, I\'m starting to appreciate the safety guarantees it provides. Here\'s what surprised me most...',
    authorId: 2 
  },
  { 
    id: 3, 
    title: 'Debugging Production Issues Like a Detective', 
    content: 'Last night our API went down and customers were affected. Here\'s the story of how we tracked down a race condition that only appeared under high load, and the monitoring improvements we implemented afterwards.',
    authorId: 1 
  },
  { 
    id: 4, 
    title: 'Why I Switched from Redux to Zustand', 
    content: 'After years of wrestling with boilerplate, I finally tried Zustand for state management. The reduction in code and mental overhead is incredible. Let me show you a real-world comparison...',
    authorId: 3 
  },
  { 
    id: 5, 
    title: 'The Art of Code Reviews', 
    content: 'Code reviews aren\'t just about catching bugs—they\'re about knowledge sharing and team growth. After doing thousands of reviews, here are my top strategies for giving feedback that developers actually appreciate.',
    authorId: 4 
  },
  { 
    id: 6, 
    title: 'Optimizing React Performance: Real Numbers', 
    content: 'Everyone talks about React performance, but few share actual metrics. I profiled our dashboard and found 3 simple changes that reduced render time by 60%. Here\'s the data and the techniques...',
    authorId: 1 
  },
  { 
    id: 7, 
    title: 'Building a Design System from Scratch', 
    content: 'Our team just launched a component library used across 12 products. The technical challenges were expected, but the organizational ones caught us off guard. Here\'s what we learned about getting buy-in...',
    authorId: 5 
  },
  { 
    id: 8, 
    title: 'Database Indexing: A Case Study', 
    content: 'A single missing index was making our queries 100x slower. This post walks through how we identified the bottleneck, added the right indexes, and set up monitoring to prevent similar issues.',
    authorId: 4 
  },
  { 
    id: 9, 
    title: 'Lessons from My First Tech Talk', 
    content: 'I just gave my first conference presentation and holy cow was I nervous! Here\'s everything I wish someone had told me about preparing slides, managing time, and handling Q&A sessions.',
    authorId: 2 
  },
]
