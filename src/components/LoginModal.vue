<template>
  <a-modal
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    @cancel="handleCancel"
    :footer="false"
    width="500px"
    :mask-closable="false"
    :mountOnEnter="false"
  >
    <template #title>
      <div class="modal-title">
        {{ activeTab === 'login' ? '登录' : '注册' }}
      </div>
    </template>

    <a-tabs v-model:activeKey="activeTab" class="login-tabs">
      <a-tab-pane key="login" title="登录">
        <a-form
          :model="loginForm"
          @submit="handleLogin"
          layout="vertical"
          ref="loginFormRef"
        >
          <a-form-item
            field="username"
            label="用户名"
            :rules="usernameRules"
          >
            <a-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              allow-clear
            >
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item
            field="password"
            label="密码"
            :rules="passwordRules"
          >
            <a-input-password
              v-model="loginForm.password"
              placeholder="请输入密码"
              allow-clear
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <div class="form-actions">
            <a-button
              type="primary"
              html-type="submit"
              long
              :loading="loading"
            >
              登录
            </a-button>
          </div>
        </a-form>
      </a-tab-pane>

      <a-tab-pane key="register" title="注册">
        <a-form
          :model="registerForm"
          @submit="handleRegister"
          layout="vertical"
          ref="registerFormRef"
        >
          <a-form-item
            field="username"
            label="用户名"
            :rules="usernameRules"
          >
            <a-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              allow-clear
            >
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item
            field="password"
            label="密码"
            :rules="passwordRules"
          >
            <a-input-password
              v-model="registerForm.password"
              placeholder="请输入密码"
              allow-clear
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>
          <a-form-item
            field="confirmPassword"
            label="确认密码"
            :rules="[
              { required: true, message: '请确认密码' },
              {
                validator: (value) => value === registerForm.password,
                message: '两次输入的密码不一致'
              }
            ]"
          >
            <a-input-password
              v-model="registerForm.confirmPassword"
              placeholder="请确认密码"
              allow-clear
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <div class="form-actions">
            <a-button
              type="primary"
              html-type="submit"
              long
              :loading="loading"
            >
              注册
            </a-button>
          </div>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconLock } from '@arco-design/web-vue/es/icon'
import type { FormInstance } from '@arco-design/web-vue'
import { useUserStore } from '../stores/user'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'login-success': []
}>()

const userStore = useUserStore()
const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref<FormInstance | null>(null)
const registerFormRef = ref<FormInstance | null>(null)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const usernameRules = [
  { required: true, message: '请输入用户名' },
  { minLength: 3, message: '用户名长度不能小于3个字符' },
  { maxLength: 20, message: '用户名长度不能超过20个字符' },
  {
    validator: (value) => {
      const regex = /^[a-zA-Z0-9_-]+$/
      return regex.test(value)
    },
    message: '用户名只能包含字母、数字、下划线和连字符'
  }
]

const passwordRules = [
  { required: true, message: '请输入密码' },
  { minLength: 8, message: '密码长度不能小于8位' },
  { maxLength: 15, message: '密码长度不能超过15位' },
  {
    validator: (value) => {
      // 检查是否包含数字
      if (!/\d/.test(value)) {
        return false
      }
      // 检查是否包含字母
      if (!/[a-zA-Z]/.test(value)) {
        return false
      }
      // 检查是否只包含合法字符（数字、字母、特殊字符）
      return /^[\w!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]+$/.test(value)
    },
    message: '密码必须包含数字和字母，可以使用特殊字符'
  }
]

const handleCancel = () => {
  loginForm.value = { username: '', password: '' }
  registerForm.value = { username: '', password: '', confirmPassword: '' }
  loginFormRef.value?.resetFields()
  registerFormRef.value?.resetFields()
  emit('update:visible', false)
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // 表单验证，validate()返回一个Promise
    await loginFormRef.value.validate();
    // 验证通过，执行登录逻辑
    await submitLogin();
  } catch (errors) {
    // 验证失败
    console.log('登录表单验证失败:', errors);
    Message.error('请检查表单填写是否正确');
  }
}

// 登录提交逻辑，只有在验证通过后才会调用
const submitLogin = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: loginForm.value.username,
        password: loginForm.value.password
      })
    });

    // 获取响应文本并打印原始内容
    const responseText = await response.text();
    console.log('登录原始响应文本:', responseText);

    // 使用特殊处理来保存原始的 userId 字符串
    // 先用正则表达式找到 "userId":数字 这样的模式
    const userIdMatch = responseText.match(/"userId"\s*:\s*(\d+)/);
    let originalUserId = null;

    if (userIdMatch && userIdMatch[1]) {
      // 提取出原始的数字字符串
      originalUserId = userIdMatch[1];
      console.log('从响应中提取的原始 userId 字符串:', originalUserId);
    }

    // 手动解析 JSON
    const result = JSON.parse(responseText);

    if (result.code === '200') {
      // 创建用户数据，使用原始提取的 userId 字符串
      const userData = {
        ...result.data
      };

      // 如果成功提取了原始 userId，使用它替换可能已经被转换的值
      if (originalUserId) {
        userData.userId = originalUserId;
      } else if (result.data.userId) {
        // 备用方案：确保 userId 是字符串
        userData.userId = String(result.data.userId);
      }

      console.log('处理后的用户数据:', userData);
      console.log('最终使用的 userId:', userData.userId);
      console.log('最终使用的 userId 类型:', typeof userData.userId);

      userStore.setUserInfo(userData);
      Message.success('登录成功');
      loginFormRef.value.resetFields();
      emit('update:visible', false);
      emit('login-success');
    } else {
      Message.error(result.msg || '登录失败，请检查用户名和密码');
    }
  } catch (error) {
    console.log('登录请求失败:', error);
    Message.error('登录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    // 表单验证，validate()返回一个Promise
    await registerFormRef.value.validate();
    // 验证通过，执行注册逻辑
    await submitRegister();
  } catch (errors) {
    // 验证失败
    console.log('注册表单验证失败:', errors);
    Message.error('请检查表单填写是否正确');
  }
}

// 注册提交逻辑，只有在验证通过后才会调用
const submitRegister = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/user/registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: registerForm.value.username,
        password: registerForm.value.password
      })
    });

    const result = await response.json();

    if (result.code === '200') {
      Message.success('注册成功，请登录');
      activeTab.value = 'login';
      registerFormRef.value.resetFields();
    } else {
      Message.error(result.msg || '注册失败，请稍后重试');
    }
  } catch (error) {
    console.log('注册请求失败:', error);
    Message.error('注册失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 监听标签页切换，重置表单
watch(activeTab, () => {
  loginFormRef.value?.resetFields()
  registerFormRef.value?.resetFields()
})
</script>

<style scoped>
.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-1);
}

.login-tabs {
  margin-top: 16px;
}

.form-actions {
  margin-top: 24px;
}

:deep(.arco-tabs-header-title) {
  font-size: 16px;
}

:deep(.arco-input-wrapper) {
  border-radius: 8px;
}

:deep(.arco-btn) {
  border-radius: 8px;
  height: 40px;
  font-size: 16px;
}
</style>