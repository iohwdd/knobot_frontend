import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const collapsed = ref(false)

  const setCollapsed = (value) => {
    collapsed.value = value
  }

  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed
  }
})