import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 获取初始值
  const storedUserInfo = localStorage.getItem('userInfo')
  const initialUserInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null

  const userInfo = ref(initialUserInfo)
  const userId = ref(initialUserInfo?.userId || null)

  const setUserInfo = (info) => {
    userInfo.value = info
    userId.value = info?.userId || null
    // 保存到 localStorage
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  const clearUserInfo = () => {
    userInfo.value = null
    userId.value = null
    // 清除 localStorage
    localStorage.removeItem('userInfo')
  }

  const isLoggedIn = () => {
    return !!userInfo.value
  }

  return {
    userInfo,
    userId,
    setUserInfo,
    clearUserInfo,
    isLoggedIn
  }
}, {
  persist: true // 启用状态持久化
})