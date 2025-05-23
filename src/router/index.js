import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/chat',
    children: [
      {
        path: '/chat',
        name: 'Chat',
        component: () => import('../views/Chat.vue'),
        children: [
          {
            path: ':memoryId',
            name: 'chat-session',
            component: () => import('../views/Chat.vue')
          }
        ]
      },
      {
        path: '/knowledge',
        name: 'Knowledge',
        component: () => import('../views/Knowledge.vue')
      },
      {
        path: '/knowledge/:id',
        name: 'KnowledgeDetail',
        component: () => import('../views/KnowledgeDetail.vue')
      },
      {
        path: '/space',
        name: 'Space',
        component: () => import('../views/Space.vue'),
        meta: {
          requiresAuth: true,
          title: '我的空间'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router