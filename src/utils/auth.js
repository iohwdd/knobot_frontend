/**
 * 认证相关工具函数
 */
import { useUserStore } from '@/stores/user'

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function checkAuth() {
  const userStore = useUserStore()
  return userStore.isLoggedIn()
}

/**
 * 创建需要认证的API调用包装器
 * @param {Function} apiCall - 需要认证的API调用函数
 * @param {string} errorMessage - 未登录时的错误提示
 * @returns {Function} 包装后的函数
 */
export function requireAuth(apiCall, errorMessage = '请先登录') {
  return async (...args) => {
    if (!checkAuth()) {
      console.warn('API调用被阻止：用户未登录')
      if (errorMessage) {
        // 可以在这里显示登录提示，或者直接返回
        console.log(errorMessage)
      }
      return Promise.resolve(null)
    }

    return apiCall(...args)
  }
}

/**
 * 监听登录状态变化的组合函数
 * @param {Object} callbacks - 回调函数对象
 * @param {Function} callbacks.onLogin - 登录时的回调
 * @param {Function} callbacks.onLogout - 退出登录时的回调
 */
export function useAuthWatcher(callbacks) {
  const { watch } = require('vue')
  const userStore = useUserStore()

  return watch(
    () => userStore.isLoggedIn(),
    (isLoggedIn, wasLoggedIn) => {
      console.log('登录状态变化:', isLoggedIn)

      if (isLoggedIn && !wasLoggedIn) {
        // 用户刚登录
        callbacks.onLogin?.()
      } else if (!isLoggedIn && wasLoggedIn) {
        // 用户刚退出登录
        callbacks.onLogout?.()
      }
    },
    { immediate: true }
  )
}
