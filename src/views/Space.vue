<template>
  <div class="space-container">
    <a-card class="profile-card">
      <div class="profile-content">
        <div class="profile-left">
          <div class="avatar-section">
            <a-avatar
              :style="{
                backgroundColor: '#3370ff',
                borderRadius: '8px',
                width: '80px',
                height: '80px'
              }"
              :size="80"
            >
              <template v-if="userStore.userInfo?.avatarUrl">
                <img :src="userStore.userInfo.avatarUrl" />
              </template>
              <template v-else>
                <icon-user :style="{ fontSize: '40px' }" />
              </template>
            </a-avatar>
          </div>
          <div class="user-info">
            <div class="nickname-row">
              <h2>{{ userStore.userInfo?.nickname || '未设置昵称' }}</h2>
              <a-button
                type="text"
                size="mini"
                @click="showEditModal = true"
              >
                <icon-edit />
              </a-button>
            </div>
            <div class="username">{{ userStore.userInfo?.userName }}</div>
            <div class="signature">{{ userStore.userInfo?.signature || '这个人很懒，还没有签名~' }}</div>
          </div>
        </div>
        <div class="profile-right">
          <div class="join-days">
            <div class="days-number">{{ joinDays }}</div>
            <div class="days-label">加入天数</div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 编辑个人信息弹窗 -->
    <a-modal
      v-model:visible="showEditModal"
      title="编辑个人信息"
      @cancel="showEditModal = false"
      @before-ok="handleSaveProfile"
    >
      <a-form :model="editForm" ref="formRef">
        <a-form-item field="avatarUrl" label="头像">
          <!-- 这里可以添加头像上传组件 -->
          <a-upload
            list-type="picture-card"
            :show-upload-button="false"
            :file-list="avatarList"
            @change="handleAvatarChange"
          />
        </a-form-item>
        <a-form-item field="nickname" label="昵称">
          <a-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </a-form-item>
        <a-form-item field="signature" label="个性签名">
          <a-textarea
            v-model="editForm.signature"
            placeholder="写点什么来介绍自己吧"
            :max-length="100"
            show-word-limit
          />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="editForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item field="password" label="修改密码">
          <a-input-password v-model="editForm.password" placeholder="不修改请留空" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconEdit } from '@arco-design/web-vue/es/icon'

const userStore = useUserStore()
const showEditModal = ref(false)
const formRef = ref(null)

// 计算加入天数
const joinDays = computed(() => {
  if (!userStore.userInfo?.createTime) return 0
  const createTime = new Date(userStore.userInfo.createTime)
  const now = new Date()
  return Math.floor((now - createTime) / (1000 * 60 * 60 * 24))
})

// 编辑表单数据
const editForm = ref({
  avatarUrl: userStore.userInfo?.avatarUrl || '',
  nickname: userStore.userInfo?.nickname || '',
  signature: userStore.userInfo?.signature || '',
  email: userStore.userInfo?.email || '',
  password: ''
})

// 头像列表
const avatarList = ref([])

// 处理头像变更
const handleAvatarChange = (fileList) => {
  avatarList.value = fileList
  if (fileList.length > 0) {
    // 这里可以处理头像上传逻辑
    editForm.value.avatarUrl = fileList[0].url
  }
}

// 保存个人信息
const handleSaveProfile = async () => {
  try {
    // 这里添加保存个人信息的接口调用
    await userStore.updateUserInfo(editForm.value)
    Message.success('保存成功')
    return true
  } catch (error) {
    Message.error('保存失败：' + error.message)
    return false
  }
}
</script>

<style scoped>
.space-container {
  height: 100%;
  padding: 16px;
  background-color: var(--color-bg-1);
}

.profile-card {
  margin-bottom: 24px;
  background-color: var(--color-bg-2);
  border: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.profile-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.profile-left {
  display: flex;
  gap: 24px;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-row h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.username {
  color: var(--color-text-3);
  font-size: 14px;
}

.signature {
  color: var(--color-text-2);
  font-size: 14px;
  max-width: 400px;
}

.profile-right {
  text-align: center;
}

.join-days {
  padding: 16px;
  background-color: var(--color-fill-2);
  border-radius: 8px;
}

.days-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text-1);
  line-height: 1;
  margin-bottom: 4px;
}

.days-label {
  font-size: 14px;
  color: var(--color-text-3);
}

:deep(.arco-upload-list-item) {
  width: 100px;
  height: 100px;
}

:deep(.arco-card-body) {
  padding: 0;
}
</style>