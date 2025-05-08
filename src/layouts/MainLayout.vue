<template>
  <div class="layout">
    <a-layout class="layout-container">
      <!-- 侧边栏 -->
      <a-layout-sider
        class="layout-sider"
        :collapsed="layoutStore.collapsed"
        :collapsible="true"
        :breakpoint="'xl'"
        @collapse="handleCollapse"
        :width="260"
      >
        <div class="logo">
          <img src="../assets/logo.png" alt="logo" v-if="!layoutStore.collapsed" />
          <img src="../assets/logo-small.png" alt="logo" v-else />
        </div>
        <a-menu
          :selected-keys="selectedKeys"
          :style="{ width: '100%' }"
        >
          <a-menu-item key="chat" @click="router.push('/chat')">
            <template #icon><icon-message /></template>
            对话
          </a-menu-item>
          <a-menu-item key="knowledge" @click="router.push('/knowledge')">
            <template #icon><icon-book /></template>
            知识库
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout class="main-container" :class="{ 'main-container-collapsed': layoutStore.collapsed }">
        <!-- 顶部导航 -->
        <a-layout-header class="layout-header">
          <div class="header-left">
            <a-button class="collapse-btn" @click="toggleCollapse">
              <icon-menu-fold v-if="!layoutStore.collapsed" />
              <icon-menu-unfold v-else />
            </a-button>
          </div>
          <div class="header-right">
            <WeatherWidget />
            <a-switch
              v-model="isDark"
              :default-checked="false"
              @change="toggleTheme"
            >
              <template #checked><icon-moon /></template>
              <template #unchecked><icon-sun /></template>
            </a-switch>

            <!-- 未登录状态 -->
            <a-button
              v-if="!userStore.isLoggedIn()"
              type="outline"
              @click="showLoginModal"
            >
              登录
            </a-button>

            <!-- 已登录状态 -->
            <a-dropdown v-else>
              <a-avatar
                :style="{
                  backgroundColor: '#3370ff',
                  borderRadius: '8px'
                }"
                :size="32"
              >
                <template v-if="userStore.userInfo?.avatarUrl">
                  <img :src="userStore.userInfo.avatarUrl" />
                </template>
                <template v-else>
                  <icon-user />
                </template>
              </a-avatar>
              <template #content>
                <a-doption @click="router.push('/space')">我的空间</a-doption>
                <a-doption @click="handleLogout">退出登录</a-doption>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>

        <!-- 主内容区 -->
        <a-layout-content class="layout-content">
          <router-view></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
    <LoginModal
      v-model:visible="showLogin"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import {
  IconMessage,
  IconBook,
  IconMenuFold,
  IconMenuUnfold,
  IconMoon,
  IconSun,
  IconUser
} from '@arco-design/web-vue/es/icon'
import WeatherWidget from '@/components/WeatherWidget.vue'
import LoginModal from '@/components/LoginModal.vue'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const userStore = useUserStore()
const isDark = ref(false)
const showLogin = ref(false)

const selectedKeys = computed(() => {
  const path = route.path
  return [path.split('/')[1] || 'chat']
})

const handleCollapse = (val) => {
  layoutStore.setCollapsed(val)
}

const toggleCollapse = () => {
  layoutStore.toggleCollapsed()
}

const toggleTheme = (checked) => {
  document.body.setAttribute('arco-theme', checked ? 'dark' : 'light')
  // 添加过渡类
  document.body.classList.add('theme-transitioning')
  setTimeout(() => {
    document.body.classList.remove('theme-transitioning')
  }, 300)
}

// 监听主题变化
watch(isDark, (newVal) => {
  document.documentElement.style.colorScheme = newVal ? 'dark' : 'light'
})

const showLoginModal = () => {
  showLogin.value = true
}

const handleLogout = () => {
  userStore.clearUserInfo()
  Message.success('已退出登录')
  router.push('/chat')
}

const handleLoginSuccess = () => {
  showLogin.value = false
  router.push('/chat')
}
</script>

<style scoped>
.layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg-1);
  transition: background-color 0.3s ease;
}

.layout-container {
  height: 100vh;
  background-color: var(--color-bg-1);
  transition: background-color 0.3s ease;
}

.layout-sider {
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
  transition: all 0.3s ease;
  background-color: var(--color-bg-2);
  border-radius: 0 12px 12px 0;
}

.logo {
  height: 32px;
  margin: 12px auto;
  text-align: center;
  transition: all 0.3s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo img {
  height: 32px;
  width: auto;
  object-fit: contain;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.logo img:hover {
  transform: scale(1.05);
}

.main-container {
  margin-left: 260px;
  transition: all 0.3s ease;
  background-color: var(--color-bg-1);
}

.main-container-collapsed {
  margin-left: 60px;
}

.layout-header {
  height: 60px;
  line-height: 60px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 99;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  margin-right: 16px;
}

.layout-content {
  min-height: calc(100vh - 60px);
  padding: 0;
  background: var(--color-bg-1);
  position: relative;
  transition: all 0.3s ease;
}

:deep(.arco-layout-sider-children) {
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--color-bg-2);
  transition: background-color 0.3s ease;
}

:deep(.arco-menu) {
  transition: all 0.3s ease;
}

:deep(.arco-btn) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.arco-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.arco-switch) {
  border-radius: 12px;
}

:deep(.arco-avatar) {
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 8px !important;
}

:deep(.arco-avatar .arco-icon) {
  font-size: 16px;
}

:deep(.arco-avatar img) {
  border-radius: 8px;
  object-fit: cover;
}

:deep(.arco-menu-item) {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease !important;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  height: 40px;
}

:deep(.arco-menu-item .arco-icon) {
  margin-right: 12px;
  font-size: 16px;
}

:deep(.arco-layout-sider-collapsed .arco-menu-item) {
  padding: 0;
  margin: 4px 8px;
  justify-content: center;
  height: 40px;
  position: relative;
  overflow: hidden;
}

:deep(.arco-layout-sider-collapsed .arco-menu-item .arco-icon) {
  margin: 0;
  font-size: 18px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.arco-layout-sider-collapsed .arco-menu-item:hover) {
  background-color: var(--color-fill-2);
}

:deep(.arco-layout-sider-collapsed .arco-menu-item.arco-menu-selected) {
  background-color: var(--color-primary-light-1);
}

:deep(.arco-layout-sider-collapsed .arco-menu-item.arco-menu-selected .arco-icon) {
  color: var(--color-primary);
  transform: translate(-50%, -50%) scale(1.1);
}

:deep(.arco-menu-item:hover) {
  transform: translateX(4px);
}

:deep(.arco-layout-sider-collapsed .arco-menu-item:hover) {
  background-color: transparent !important;
  transform: none;
}

:deep(.arco-menu-item.arco-menu-selected) {
  font-weight: 600;
}

:deep(.arco-layout-sider-collapsed .arco-menu-item.arco-menu-selected) {
  background-color: transparent !important;
}

:deep(.arco-layout-sider-collapsed) {
  width: 60px !important;
}

:deep(.arco-menu-collapse-button) {
  width: 60px !important;
}

@media screen and (max-width: 1200px) {
  .layout-sider {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
  }

  .main-container {
    margin-left: 48px;
  }
}

@media screen and (max-width: 768px) {
  .layout-header {
    padding: 0 12px;
  }

  .header-right {
    gap: 12px;
  }

  .layout-content {
    padding: 12px;
  }
}
</style>