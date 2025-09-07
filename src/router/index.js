import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
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

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.meta?.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn()) {
      console.log('路由需要认证，但用户未登录，重定向到聊天页面')
      // 可以重定向到登录页面或者聊天页面（会显示登录按钮）
      next('/chat')
      return
    }
  }
  next()
})

export default router