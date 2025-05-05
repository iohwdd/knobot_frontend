import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '2', // 暂时 mock 为 '2'
  }),
  getters: {
    getUserId: (state) => state.userId,
  },
  actions: {
    setUserId(userId) {
      this.userId = userId
    },
  },
})