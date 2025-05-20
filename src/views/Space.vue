<template>
  <div class="space-container">
    <a-card class="profile-card">
      <div class="profile-content">
        <div class="profile-left">
          <div class="avatar-section">
            <a-avatar :key="avatarKey" :size="120" class="profile-avatar">
              <template v-if="userDetailInfo?.avatarUrl">
                <img :src="userDetailInfo.avatarUrl + '?t=' + avatarTimestamp" alt="用户头像" />
              </template>
              <template v-else>
                <div class="default-avatar">
                  <icon-user style="color: #fff; font-size: 60px;" />
                </div>
              </template>
            </a-avatar>
          </div>
          <div class="user-info">
            <div class="nickname-row">
              <h2>{{ userDetailInfo?.nickName || '未设置昵称' }}</h2>
              <div class="username-container">
                <span class="username-label">用户名：</span>
                <span class="username-value">{{ userDetailInfo?.username || userStore.userInfo?.userName }}</span>
              </div>
            </div>
            <div class="signature-row">
              <div class="signature">{{ userDetailInfo?.description || '这个人很懒，还没有签名~' }}</div>
              <a-button
                type="text"
                size="mini"
                class="edit-btn"
                @click="showEditModal = true"
              >
                <icon-edit />
              </a-button>
            </div>
          </div>
        </div>
        <div class="profile-right">
          <div class="join-days">
            <div class="days-number">{{ userDetailInfo?.joinDays || 0 }}</div>
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
        <a-form-item field="email" label="邮箱">
          <template v-if="!userDetailInfo?.email">
            <a-button type="outline" size="small" @click="showBindEmailModal = true">
              绑定邮箱
            </a-button>
          </template>
          <template v-else>
            <span class="email-display">{{ userDetailInfo.email }}</span>
          </template>
        </a-form-item>
        <a-form-item field="avatarUrl" label="头像">
          <div class="avatar-uploader-container">
            <div class="avatar-upload-wrapper">
              <!-- 有头像时显示预览 -->
              <div class="avatar-preview" v-if="avatarFile">
                <a-image
                  width="120"
                  height="120"
                  :src="avatarFile.url"
                  :preview-visible="false"
                  @click="handlePreview"
                  fit="cover"
                  class="preview-image"
                />
                <div class="preview-actions">
                  <icon-upload class="action-icon upload-icon" @click="triggerUpload" />
                  <icon-delete class="delete-icon" @click="handleDeleteAvatar" />
                </div>
              </div>

              <!-- 无头像时显示上传区域 -->
              <div v-else class="avatar-placeholder" @click="triggerUpload">
                <icon-upload :size="24" />
                <span class="upload-text">点击上传</span>
              </div>

              <!-- 隐藏的上传组件 -->
              <a-upload
                ref="uploadRef"
                action="/"
                :file-list="[]"
                :show-upload-list="false"
                :custom-request="handleManualUpload"
                @change="handleAvatarChange"
                accept="image/jpeg,image/png,image/jpg"
                class="hidden-upload"
                :auto-upload="true"
                :multiple="false"
                :with-credentials="false"
                :limit="1"
              />
            </div>
          </div>
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

        <a-form-item field="password" label="修改密码">
          <a-input-password
            v-model="editForm.password"
            placeholder="不修改请留空"
            @input="handlePasswordInput"
            allow-clear
          />
        </a-form-item>

        <a-form-item
          field="confirmPassword"
          label="确认密码"
          v-if="showConfirmPassword"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword, message: '两次输入的密码不一致' }
          ]"
        >
          <a-input-password
            v-model="editForm.confirmPassword"
            placeholder="请再次输入密码"
            @input="handleConfirmPasswordInput"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal
      v-model:visible="imagePreviewVisible"
      :footer="false"
      :mask-closable="true"
      class="image-preview-modal"
      :closable="true"
      @cancel="closeImagePreview"
    >
      <div class="image-preview-container">
        <img :src="previewImageSrc" class="preview-modal-image" />
      </div>
    </a-modal>

    <!-- 绑定邮箱弹窗 -->
    <a-modal
      v-model:visible="showBindEmailModal"
      title="绑定邮箱"
      @cancel="showBindEmailModal = false"
      @before-ok="handleBindEmail"
    >
      <a-form :model="bindEmailForm" ref="bindEmailFormRef">
        <a-form-item field="email" label="邮箱地址" :rules="[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '请输入正确的邮箱格式' }
        ]">
          <a-input v-model="bindEmailForm.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        <a-form-item field="code" label="验证码" :rules="[
          { required: true, message: '请输入验证码' },
          { minLength: 6, message: '验证码长度不正确' }
        ]">
          <div class="code-input-wrapper">
            <a-input v-model="bindEmailForm.code" placeholder="请输入验证码" />
            <a-button
              type="primary"
              :disabled="countDown > 0"
              @click="sendEmailCode"
            >
              {{ countDown > 0 ? `${countDown}秒后重试` : '发送验证码' }}
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick, inject } from 'vue'
import { useUserStore } from '@/stores/user'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconUser,
  IconEdit,
  IconPlus,
  IconUpload,
  IconClose,
  IconFile,
  IconDelete
} from '@arco-design/web-vue/es/icon'
import request from '@/utils/request'
// 导入Image组件的样式
import '@arco-design/web-vue/es/image/style/css'

const userStore = useUserStore()
const showEditModal = ref(false)
const showBindEmailModal = ref(false)
const formRef = ref(null)
const bindEmailFormRef = ref(null)
const userDetailInfo = ref(null)
const countDown = ref(0)
let timer = null

// 邮箱绑定表单
const bindEmailForm = ref({
  email: '',
  code: ''
})

// 添加一个用于强制重新渲染的key
const avatarKey = ref(0)
const avatarTimestamp = ref(Date.now())

// 注入刷新头像的方法，如果不存在则使用空函数
const refreshAvatar = inject('refreshAvatar', () => {
  console.log('[Space] 无法刷新头像，父组件未提供refreshAvatar方法');
});

// 获取用户详情信息
const fetchUserDetailInfo = async () => {
  try {
    // 获取 userId 并确保是字符串
    const userId = userStore.getUserId();
    console.log('Space.vue - 原始 userId:', userId);

    if (!userId) {
      Message.error('用户未登录或用户ID无效');
      return;
    }

    // 构建请求参数，明确转为字符串
    const requestData = {
      userId: String(userId)
    };

    console.log('Space.vue - 发送获取用户详情请求参数:', requestData);

    // 发送请求
    const response = await request.post('/api/user-query/queryUserDetailInfo', requestData);

    console.log('Space.vue - 用户详情响应:', response.data);

    if (response.data.code === 200) {
      // 保存用户详情数据
      userDetailInfo.value = response.data.data;

      // 记录关键字段，便于调试
      console.log('Space.vue - 用户详情数据:', {
        nickName: userDetailInfo.value?.nickName,
        username: userDetailInfo.value?.username,
        description: userDetailInfo.value?.description,
        joinDays: userDetailInfo.value?.joinDays
      });

      // 初始化编辑表单数据
      if (userDetailInfo.value) {
        editForm.value = {
          ...editForm.value,
          nickname: userDetailInfo.value.nickName || '',
          signature: userDetailInfo.value.description || '',
          // 用户名不可修改，仅展示
        };
      }
    } else {
      Message.error(response.data.msg || '获取用户详情失败');
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
    Message.error('获取用户详情失败：' + error.message);
  }
};

// 在组件挂载时获取用户详情
onMounted(() => {
  fetchUserDetailInfo()
})

// 清除定时器
onUnmounted(() => {
  clearInterval(timer)
})

// 编辑表单数据
const editForm = ref({
  avatarUrl: '',
  nickname: '',
  signature: '',
  email: userStore.userInfo?.email || '',
  password: '',
  confirmPassword: '',
  avatarFile: null
})

// 监视对话框显示状态，确保正确初始化表单
watch(() => showEditModal.value, (isVisible) => {
  if (isVisible) {
    // 对话框显示时，确保表单状态正确
    console.log('[showEditModal watch] 对话框打开，初始化表单状态');
  } else {
    // 对话框关闭时，清除所有敏感字段
    console.log('[showEditModal watch] 对话框关闭，清除表单状态');
    editForm.value.password = '';
    editForm.value.confirmPassword = '';
    showConfirmPassword.value = false;
  }
});

// 当用户详情信息更新时，同步更新编辑表单
watch(() => userDetailInfo.value, (newValue) => {
  if (newValue) {
    editForm.value = {
      ...editForm.value,
      avatarUrl: newValue.avatarUrl || '',
      nickname: newValue.nickName || '',
      signature: newValue.description || '',
      // 保留现有的密码字段和确认密码字段
      password: '',
      confirmPassword: '',
      // 清空文件对象，只有在用户选择新文件时才重新设置
      avatarFile: null
    }

    // 如果有头像，更新头像列表
    if (newValue.avatarUrl) {
      avatarFile.value = {
        uid: '-1',
        name: 'avatar.png',
        url: newValue.avatarUrl,
        status: 'done',
      };
    } else {
      avatarFile.value = null;
    }
  }
}, { immediate: true })

// 头像列表
const avatarFile = ref(null)

// 自定义上传方法 - 彻底重构
const handleManualUpload = (options) => {
  try {
    console.log('[handleManualUpload] 开始处理文件上传');

    // 1. 全面检查选项对象，查找文件对象
    if (!options) {
      console.error('[handleManualUpload] 传入的options为空');
      Message.error('上传处理失败：内部参数错误');
      return;
    }

    // 打印options中的所有顶级键
    console.log('[handleManualUpload] options包含的键:', Object.keys(options));

    // 尝试获取文件对象
    let fileObj = null;

    // Arco Design会在fileItem中提供文件
    if (options.fileItem) {
      console.log('[handleManualUpload] 检查fileItem:', options.fileItem);

      if (options.fileItem.file && options.fileItem.file instanceof File) {
        fileObj = options.fileItem.file;
        console.log('[handleManualUpload] 从fileItem.file获取到File对象');
      } else if (options.fileItem instanceof File) {
        fileObj = options.fileItem;
        console.log('[handleManualUpload] fileItem本身是File对象');
      }
    }

    // 如果还没有找到文件，尝试检查file属性
    if (!fileObj && options.file) {
      console.log('[handleManualUpload] 检查file属性:', typeof options.file);

      if (options.file instanceof File) {
        fileObj = options.file;
        console.log('[handleManualUpload] file本身是File对象');
      } else if (options.file.originFileObj && options.file.originFileObj instanceof File) {
        fileObj = options.file.originFileObj;
        console.log('[handleManualUpload] 从file.originFileObj获取到File对象');
      } else if (options.file.raw && options.file.raw instanceof File) {
        fileObj = options.file.raw;
        console.log('[handleManualUpload] 从file.raw获取到File对象');
      }
    }

    // 2. 如果还是找不到文件对象，则报错
    if (!fileObj) {
      console.error('[handleManualUpload] 无法找到有效的文件对象');

      // 尝试更详细地检查options结构
      let detailedLog = '选项结构:\n';
      try {
        for (const key in options) {
          detailedLog += `- ${key}: ${typeof options[key]}\n`;
          if (options[key] && typeof options[key] === 'object') {
            for (const subKey in options[key]) {
              detailedLog += `  - ${subKey}: ${typeof options[key][subKey]}\n`;
            }
          }
        }
        console.log(detailedLog);
      } catch (e) {
        console.warn('无法详细记录options结构:', e);
      }

      if (typeof options.onError === 'function') {
        options.onError(new Error('无法找到有效的文件对象'));
      }
      Message.error('上传失败：无法找到有效的文件对象');
      return;
    }

    // 3. 文件基本信息
    console.log('[handleManualUpload] 文件信息:', {
      name: fileObj.name,
      type: fileObj.type,
      size: fileObj.size
    });

    // 4. 验证文件类型
    if (!fileObj.type || !['image/jpeg', 'image/png', 'image/jpg'].includes(fileObj.type)) {
      console.error('[handleManualUpload] 不支持的文件类型:', fileObj.type);
      if (typeof options.onError === 'function') {
        options.onError(new Error('不支持的文件类型'));
      }
      Message.error('只支持 jpg、jpeg、png 格式的图片');
      return;
    }

    // 5. 验证文件大小
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (fileObj.size > maxSize) {
      console.error('[handleManualUpload] 文件太大:', fileObj.size);
      if (typeof options.onError === 'function') {
        options.onError(new Error('文件太大'));
      }
      Message.error('图片大小不能超过 2MB');
      return;
    }

    // 6. 处理文件
    // 创建预览URL
    const previewUrl = URL.createObjectURL(fileObj);
    console.log('[handleManualUpload] 创建预览URL:', previewUrl);

    // 更新状态 - 简化处理，不添加时间戳和额外的参数
    editForm.value.avatarFile = fileObj;
    avatarFile.value = {
      uid: Date.now().toString(),
      name: fileObj.name,
      url: previewUrl,
      status: 'done'
    };

    // 7. 调用成功回调
    console.log('[handleManualUpload] 处理完成，调用成功回调');
    if (typeof options.onSuccess === 'function') {
      options.onSuccess({
        url: previewUrl,
        message: '上传成功'
      });
    }

    return {
      abort: () => {
        console.log('[handleManualUpload] 上传被中止');
      }
    };
  } catch (error) {
    console.error('[handleManualUpload] 发生错误:', error);
    if (options && typeof options.onError === 'function') {
      options.onError(error);
    }
    Message.error('上传处理失败: ' + (error.message || '未知错误'));
    return {
      abort: () => {
        console.log('[handleManualUpload] 上传被中止');
      }
    };
  }
};

// 完全重写头像变更处理函数
const handleAvatarChange = (info) => {
  console.log('[handleAvatarChange] 文件状态变更, info:', info);

  if (!info) return;

  // 尝试以多种方式获取状态
  const status = info.file?.status || info.status;
  console.log('[handleAvatarChange] 文件状态:', status);

  // 处理各种状态
  if (status === 'done') {
    console.log('[handleAvatarChange] 上传完成, 文件信息:', info.file);
    // handleManualUpload 已经更新了状态，这里不需要做额外处理
  } else if (status === 'error') {
    console.error('[handleAvatarChange] 上传失败:',
      'response:', info.file?.response,
      'error:', info.file?.error);
    // 显示友好的错误信息，详细的错误信息已在 handleManualUpload 中处理
    Message.error('头像上传失败');
  } else if (status === 'uploading') {
    console.log('[handleAvatarChange] 上传中...');
    if (avatarFile.value) {
      avatarFile.value.status = 'uploading';
    }
  } else if (status === 'removed') {
    console.log('[handleAvatarChange] 文件已移除');
    handleDeleteAvatar();
  } else {
    console.log('[handleAvatarChange] 未知状态:', status);
  }
};

// 发送邮箱验证码
const sendEmailCode = async () => {
  try {
    // 表单验证邮箱格式
    if (!bindEmailForm.value.email) {
      Message.error('请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bindEmailForm.value.email)) {
      Message.error('邮箱格式不正确');
      return;
    }

    // 构建请求参数
    const requestData = {
      userId: String(userStore.getUserId()), // 确保userId是字符串，避免大数值精度丢失
      to: bindEmailForm.value.email
    };

    console.log('发送验证码请求参数:', requestData);
    console.log('userId类型:', typeof requestData.userId);

    // 发送请求
    const response = await request.post('/api/user/sendEmail', requestData);

    console.log('发送验证码响应:', response);

    // 检查响应是否有效
    if (!response || !response.data) {
      throw new Error('服务器响应无效');
    }

    if (response.data.code === 200) {
      Message.success('验证码已发送，请查收');
      // 开始倒计时
      startCountDown();
    } else {
      // 获取详细错误信息
      const errorMsg = response.data.msg || '发送验证码失败';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    // 更友好的错误提示
    let errorMessage = '发送验证码失败';

    if (error.response) {
      // 服务器返回了错误状态码
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
      errorMessage = error.response.data?.msg || `服务器错误 (${error.response.status})`;
    } else if (error.request) {
      // 请求发送成功但没有收到响应
      console.error('未收到响应:', error.request);
      errorMessage = '服务器无响应，请检查网络连接';
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message);
      errorMessage = error.message || '请求配置错误';
    }

    Message.error(`发送验证码失败: ${errorMessage}`);
  }
};

// 倒计时功能
const startCountDown = () => {
  countDown.value = 60;
  clearInterval(timer);
  timer = setInterval(() => {
    if (countDown.value > 0) {
      countDown.value--;
    } else {
      clearInterval(timer);
    }
  }, 1000);
};

// 绑定邮箱
const handleBindEmail = async () => {
  try {
    if (!bindEmailFormRef.value) return false;

    // 表单验证
    const errors = await bindEmailFormRef.value.validate();
    if (errors) {
      return false;
    }

    // 构建请求参数
    const requestData = {
      userId: String(userStore.getUserId()), // 改为字符串类型，避免大数值精度丢失
      newEmail: bindEmailForm.value.email,
      code: bindEmailForm.value.code
    };

    console.log('绑定邮箱请求参数:', requestData);
    console.log('userId类型:', typeof requestData.userId);

    // 发送请求
    const response = await request.post('/api/user/bindEmail', requestData);

    console.log('绑定邮箱响应:', response);

    // 检查响应是否有效
    if (!response || !response.data) {
      throw new Error('服务器响应无效');
    }

    if (response.data.code === 200) {
      Message.success('绑定成功');
      // 清空表单
      bindEmailForm.value = { email: '', code: '' };
      // 关闭弹窗
      showBindEmailModal.value = false;
      // 重新获取用户信息
      await fetchUserDetailInfo();
      return true;
    } else {
      // 获取详细错误信息
      const errorMsg = response.data.msg || '验证码错误或已过期';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('绑定邮箱失败:', error);
    // 更友好的错误提示
    let errorMessage = '绑定邮箱失败';

    if (error.response) {
      // 服务器返回了错误状态码
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
      errorMessage = error.response.data?.msg || `服务器错误 (${error.response.status})`;
    } else if (error.request) {
      // 请求发送成功但没有收到响应
      console.error('未收到响应:', error.request);
      errorMessage = '服务器无响应，请检查网络连接';
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message);
      errorMessage = error.message || '请求配置错误';
    }

    Message.error(`绑定失败: ${errorMessage}`);
    return false;
  }
};

// 修改保存处理函数，确保头像更新时强制重新渲染
const handleSaveProfile = async (done) => {
  try {
    // 如果有输入密码，先校验密码是否一致
    if (editForm.value.password) {
      // 确保两个值都已定义并且是字符串
      const password = String(editForm.value.password || '');
      const confirm = String(editForm.value.confirmPassword || '');

      // 在提交时检查密码是否一致
      if (password !== confirm) {
        Message.error('两次输入的密码不一致');
        if (done) done(false);
        return false;
      }
    }

    // 表单验证
    if (formRef.value) {
      const validationErrors = await formRef.value.validate();
      if (validationErrors) {
        console.log('表单验证失败:', validationErrors);
        Message.error('请检查表单必填项');
        if (done) done(false);
        return false;
      }
    }

    // 创建FormData对象
    const formData = new FormData();

    // 添加用户ID
    formData.append('userId', String(userStore.getUserId()));

    // 添加昵称
    if (editForm.value.nickname) {
      formData.append('nickname', editForm.value.nickname);
    }

    // 添加个性签名
    if (editForm.value.signature) {
      formData.append('description', editForm.value.signature);
    }

    // 添加密码（如果有修改）
    if (editForm.value.password) {
      console.log('[handleSaveProfile] 处理密码字段:', {
        password: editForm.value.password,
        confirmPassword: editForm.value.confirmPassword,
        passwordLength: editForm.value.password?.length,
        confirmLength: editForm.value.confirmPassword?.length,
        showConfirmPassword: showConfirmPassword.value,
        isEqual: editForm.value.password === editForm.value.confirmPassword
      });

      // 确保两个值都已定义并且是字符串
      const password = String(editForm.value.password || '');

      // 确保传递的是字符串值
      formData.append('newPassword', password.toString());
      console.log('[handleSaveProfile] 添加密码到表单成功, 密码类型:', typeof password, '密码值:', password);
    }

    // 添加头像文件（如果有）
    console.log('[handleSaveProfile] 准备添加头像文件, editForm.value.avatarFile:', editForm.value.avatarFile);
    if (editForm.value.avatarFile) {
      if (editForm.value.avatarFile instanceof File) {
        console.log('[handleSaveProfile] 头像文件是 File 对象: Name:', editForm.value.avatarFile.name, 'Size:', editForm.value.avatarFile.size, 'Type:', editForm.value.avatarFile.type);
        formData.append('avatar', editForm.value.avatarFile);
      } else {
        console.error('[handleSaveProfile] avatarFile 存在但不是 File 对象. Type:', typeof editForm.value.avatarFile, 'Value:', editForm.value.avatarFile);
        Message.error('头像文件格式错误，请重新上传');
        if (done) done(false);
        return false;
      }
    } else {
      console.log('[handleSaveProfile] 没有头像文件需要上传');
    }

    console.log('[handleSaveProfile] 发送请求前，FormData内容:');
    for (const pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]}`);
    }

    // 发送请求
    const response = await request.post('/api/user/modifyInfo', formData, {
      headers: {
        // 会自动设置 multipart/form-data
      }
    });

    console.log('[handleSaveProfile] 服务器响应:', response.data);

    if (!response || !response.data) {
      throw new Error('服务器响应无效');
    }

    if (response.data.code === 200) {
      Message.success('保存成功');

      // 清理表单状态
      editForm.value.password = '';
      editForm.value.confirmPassword = '';
      editForm.value.avatarFile = null;
      avatarFile.value = null;
      showConfirmPassword.value = false;
      showEditModal.value = false;

      // 检查是否更新了头像
      const hasUpdatedAvatar = formData.has('avatar');

      // 重新获取用户信息
      try {
        await fetchUserDetailInfo();

        // 如果用户有头像URL，更新到userStore中
        if (userDetailInfo.value && userDetailInfo.value.avatarUrl) {
          userStore.updateAvatar(userDetailInfo.value.avatarUrl);

          // 如果更新了头像，强制重新渲染
          if (hasUpdatedAvatar) {
            // 更新时间戳和key
            avatarTimestamp.value = Date.now();
            avatarKey.value++;

            console.log('[handleSaveProfile] 更新了头像，强制重新渲染');

            // 立即通知主布局更新头像
            refreshAvatar();
          }
        }
      } catch (error) {
        console.error('[handleSaveProfile] 获取用户信息失败:', error);
        Message.warning('个人信息已保存，但页面刷新失败，请手动刷新页面');
      }

      if (done) done(true);
      return true;
    } else {
      throw new Error(response.data.msg || '保存失败');
    }
  } catch (error) {
    console.error('[handleSaveProfile] 保存个人信息失败:', error);
    let errorMessage = '保存个人信息失败';
    if (error.response) {
      errorMessage = error.response.data?.msg || `服务器错误 (${error.response.status})`;
    } else if (error.request) {
      errorMessage = '服务器无响应，请检查网络连接';
    } else {
      errorMessage = error.message || '请求配置错误';
    }
    Message.error(`保存失败: ${errorMessage}`);
    if (done) done(false);
    return false;
  }
};

// 密码修改的动态校验逻辑
const showConfirmPassword = ref(false)
const handlePasswordInput = () => {
  console.log('[handlePasswordInput] 密码改变:', {
    password: editForm.value.password,
    passwordLength: editForm.value.password?.length,
    hasContent: !!editForm.value.password?.trim()
  });

  // 检查密码是否有实际内容（去除空格后）
  if (editForm.value.password?.trim()) {
    showConfirmPassword.value = true;
  } else {
    showConfirmPassword.value = false;
    // 如果密码为空或只有空格，清空密码字段
    editForm.value.password = '';
  }
}

// 确认密码输入处理
const handleConfirmPasswordInput = () => {
  console.log('[handleConfirmPasswordInput] 确认密码改变:', {
    password: editForm.value.password,
    confirmPassword: editForm.value.confirmPassword,
    isEqual: editForm.value.password === editForm.value.confirmPassword
  });

  // 不需要额外处理，但记录日志有助于调试
}

const validateConfirmPassword = (rule, value) => {
  // 在这里直接返回成功，因为我们会在提交时进行校验
  return Promise.resolve();
}

// 图片预览
const imagePreviewVisible = ref(false);
const previewImageSrc = ref('');

// 打开图片预览
const openImagePreview = (url) => {
  previewImageSrc.value = url;
  imagePreviewVisible.value = true;
};

// 处理替换头像
const handleReplaceAvatar = (e) => {
  e.stopPropagation();
  // 触发文件选择器点击
  const uploadInput = document.querySelector('.avatar-uploader .arco-upload-input');
  if (uploadInput) {
    uploadInput.click();
  }
};

// 关闭图片预览
const closeImagePreview = () => {
  imagePreviewVisible.value = false;
  // 清除预览URL以避免内存泄漏
  previewImageSrc.value = '';
};

// 处理预览
const handlePreview = (e) => {
  e && e.stopPropagation(); // 阻止事件冒泡

  if (avatarFile.value?.url) {
    console.log('[handlePreview] 打开图片预览:', avatarFile.value.url);
    previewImageSrc.value = avatarFile.value.url;
    imagePreviewVisible.value = true;
  } else {
    console.warn('[handlePreview] 没有可预览的图片');
  }
};

// 删除头像
const handleDeleteAvatar = () => {
  console.log('[handleDeleteAvatar] 删除头像');
  avatarFile.value = null;
  editForm.value.avatarFile = null;
};

// 模板中新增了uploadRef，需要在script中定义
const uploadRef = ref(null);

// 触发文件上传
const triggerUpload = () => {
  console.log('[triggerUpload] 触发文件上传');
  if (uploadRef.value) {
    // 模拟点击隐藏的上传按钮
    const uploadBtn = uploadRef.value.$el.querySelector('input[type="file"]');
    if (uploadBtn) {
      uploadBtn.click();
    } else {
      console.error('[triggerUpload] 未找到上传输入框');
    }
  } else {
    console.error('[triggerUpload] uploadRef未定义');
  }
};
</script>
<style scoped>
.avatar-section {
  flex-shrink: 0;
  margin-right: 16px;
  width: 120px;
  height: 120px;
}

/* 基本头像样式 */
.profile-avatar {
  border: none;
  padding: 0;
  background: none;
  width: 120px !important;
  height: 120px !important;
  overflow: hidden !important;
}

:deep(.profile-avatar .arco-avatar-image) {
  background: none;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden;
}

:deep(.profile-avatar img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  padding: 0 !important;
  margin: 0 !important;
}

.default-avatar {
  width: 100%;
  height: 100%;
  background-color: #3370ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}

/* 覆盖全局样式，确保一致性 */
:deep(.arco-avatar) {
  border-radius: 50% !important;
  overflow: hidden !important;
}

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

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nickname-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.nickname-row h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.username-container {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.username-label {
  color: var(--color-text-3);
}

.username-value {
  color: var(--color-text-3);
}

.signature-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.signature {
  color: var(--color-text-2);
  font-size: 14px;
  max-width: 380px;
  flex: 1;
}

.edit-btn {
  color: var(--color-text-3);
  transition: all 0.2s ease-in-out;
  padding: 0 2px;
  min-width: 16px;
  margin-left: 0;
}

.edit-btn:hover {
  color: rgb(var(--primary-6));
}

.profile-right {
  text-align: center;
}

.join-days {
  padding: 25px;
  margin-right: 16px;
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

.code-input-wrapper {
  display: flex;
  gap: 10px;
}

.code-input-wrapper .arco-input {
  flex: 1;
}

.code-input-wrapper .arco-btn {
  min-width: 100px;
  white-space: nowrap;
}

.email-display {
  color: var(--color-text-3);
  font-size: 14px;
}

:deep(.arco-card-body) {
  padding: 0;
}

/* 自定义头像上传样式 */
.avatar-uploader-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.avatar-upload-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-preview:hover .preview-actions {
  opacity: 1;
}

/* 修改深层样式，使图片完全填充区域 */
:deep(.arco-image) {
  width: 100%;
  height: 100%;
}

:deep(.arco-image-img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.preview-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.action-icon {
  cursor: pointer;
  color: #fff;
  font-size: 24px;
  transition: transform 0.2s;
}

.action-icon:hover {
  transform: scale(1.2);
}

.upload-icon {
  color: var(--color-white);
}

.delete-icon {
  color: var(--color-white);
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 1px dashed var(--color-border-3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--color-fill-2);
}

.avatar-placeholder:hover {
  border-color: rgb(var(--primary-5));
  background-color: var(--color-fill-3);
}

.upload-text {
  color: var(--color-text-3);
  font-size: 14px;
  margin-top: 8px;
}

.hidden-upload {
  display: none;
}

.image-preview-modal :deep(.arco-modal-content) {
  padding: 0;
  background: none;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.preview-modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.preview-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}

.preview-controls .arco-btn {
  background-color: rgba(255, 255, 255, 0.8);
  transition: background-color 0.3s ease;
}

.preview-controls .arco-btn:hover {
  background-color: rgba(255, 255, 255, 1);
}

.delete-icon, .upload-icon {
  cursor: pointer;
  color: #fff;
  font-size: 24px;
  transition: transform 0.2s;
}

.delete-icon:hover, .upload-icon:hover {
  transform: scale(1.1);
}

/* 补充缺失的关键样式 */
.profile-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* 修复编辑预览时的头像样式 */
:deep(.arco-image-img) {
  border-radius: 50% !important;
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
}

/* 但弹窗中的大图预览不用圆角 */
.preview-modal-image {
  border-radius: 0 !important;
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain !important;
}

/* 头像上传预览组件 */
:deep(.preview-image .arco-image-img) {
  border-radius: 50% !important;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 确保上传占位符也是圆形 */
.avatar-placeholder {
  border-radius: 50% !important;
}

/* 在个人资料卡中覆盖为方形 */
.profile-card .profile-avatar {
  border-radius: 8px !important;
}
.profile-card :deep(.profile-avatar .arco-avatar-image) {
  border-radius: 8px !important;
}
.profile-card :deep(.profile-avatar img) {
  border-radius: 8px !important;
}
.profile-card .default-avatar {
  border-radius: 8px !important;
}

/* 编辑区样式和方形头像样式 */

/* 编辑弹窗和预览中的圆形头像 */
.a-modal .avatar-preview,
.image-preview-modal .preview-modal-image {
  border-radius: 50%;
}

/* 头像上传组件样式 */
.avatar-placeholder {
  border-radius: 50% !important;
}

:deep(.avatar-preview .arco-image-img),
:deep(.preview-image .arco-image-img) {
  border-radius: 50% !important;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 但弹窗中的大图预览不用圆角 */
.preview-modal-image {
  border-radius: 0 !important;
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain !important;
}

/* 编辑弹窗和预览中的圆形头像 */
.avatar-uploader-container .avatar-preview,
.avatar-uploader-container .preview-image {
  border-radius: 50% !important;
  overflow: hidden;
}
</style>