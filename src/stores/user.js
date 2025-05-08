import { defineStore } from 'pinia'
import { ref } from 'vue'

// 确保 userId 是字符串类型
function ensureStringUserId(userId) {
  if (userId === null || userId === undefined) return null;
  // 确保使用 String() 而不是 toString() 方法，避免类型错误
  return String(userId);
}

// 清理URL，移除查询参数
function cleanAvatarUrl(url) {
  if (!url) return url;
  return url.split('?')[0]; // 移除可能的查询参数
}

export const useUserStore = defineStore('user', () => {
  // 用户信息，统一使用一个数据结构
  const userInfo = ref(null)

  // 设置用户信息
  const setUserInfo = (info) => {
    if (info) {
      // 创建新对象，避免修改原始对象
      const processedInfo = { ...info }

      // 确保 userId 保持原始字符串形式
      if (info.userId !== undefined) {
        // 使用 ensureStringUserId 确保字符串类型
        processedInfo.userId = ensureStringUserId(info.userId)
        console.log('Store - 设置用户信息: userId =', processedInfo.userId)
      }

      // 保存处理后的信息
      userInfo.value = processedInfo
    } else {
      userInfo.value = null
    }
  }

  // 清除用户信息
  const clearUserInfo = () => {
    userInfo.value = null
  }

  // 更新用户信息
  const updateUserInfo = async (updatedInfo) => {
    if (userInfo.value) {
      // 创建新对象，避免修改原始对象
      const newUpdatedInfo = { ...updatedInfo }

      // 若更新包含 userId，确保它是字符串
      if (updatedInfo.userId !== undefined) {
        newUpdatedInfo.userId = ensureStringUserId(updatedInfo.userId)
        console.log('Store - 更新用户信息: userId =', newUpdatedInfo.userId)
      }

      // 合并更新的信息
      userInfo.value = {
        ...userInfo.value,
        ...newUpdatedInfo
      }
      return userInfo.value
    }
    return null
  }

  // 更新用户头像 - 优化响应速度
  const updateAvatar = (avatarUrl) => {
    if (userInfo.value && avatarUrl) {
      // 清理URL，避免重复添加时间戳
      const cleanUrl = cleanAvatarUrl(avatarUrl);
      userInfo.value.avatarUrl = cleanUrl;
      console.log('Store - 更新用户头像: avatarUrl =', cleanUrl);
      return true;
    }
    return false;
  }

  // 获取带时间戳的头像URL
  const getAvatarWithTimestamp = () => {
    if (!userInfo.value?.avatarUrl) return null;
    return `${userInfo.value.avatarUrl}?t=${Date.now()}`;
  }

  // 检查是否已登录
  const isLoggedIn = () => {
    return !!userInfo.value
  }

  // 获取 userId (始终返回字符串类型)
  const getUserId = () => {
    const id = userInfo.value?.userId
    if (id === undefined || id === null) return null
    return ensureStringUserId(id)
  }

  return {
    userInfo,
    setUserInfo,
    clearUserInfo,
    updateUserInfo,
    updateAvatar,
    getAvatarWithTimestamp,
    isLoggedIn,
    getUserId
  }
}, {
  persist: {
    // 使用单一存储键名，避免重复存储
    key: 'user-store',
    storage: localStorage,
    serializer: {
      // 自定义序列化，确保 userId 作为字符串存储
      serialize: (state) => {
        // 创建深拷贝以避免修改原始状态
        const stateCopy = JSON.parse(JSON.stringify(state))

        // 确保 userId 是字符串
        if (stateCopy.userInfo && stateCopy.userInfo.userId !== undefined) {
          stateCopy.userInfo.userId = String(stateCopy.userInfo.userId)
        }

        // 清理头像URL，移除查询参数
        if (stateCopy.userInfo && stateCopy.userInfo.avatarUrl) {
          stateCopy.userInfo.avatarUrl = cleanAvatarUrl(stateCopy.userInfo.avatarUrl);
        }

        return JSON.stringify(stateCopy)
      },
      deserialize: (storedState) => {
        try {
          const state = JSON.parse(storedState)

          // 确保 userId 是字符串
          if (state && state.userInfo && state.userInfo.userId !== undefined) {
            state.userInfo.userId = String(state.userInfo.userId)
          }

          // 清理头像URL，移除查询参数
          if (state && state.userInfo && state.userInfo.avatarUrl) {
            state.userInfo.avatarUrl = cleanAvatarUrl(state.userInfo.avatarUrl);
          }

          return state
        } catch (e) {
          console.error('反序列化用户状态失败:', e)
          return { userInfo: null }
        }
      }
    }
  }
})