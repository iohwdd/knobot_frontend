<template>
  <div class="chat-container">
    <!-- 左侧历史记录 -->
    <div class="chat-sidebar" :class="{ 'chat-sidebar-mobile': isMobile }">
      <a-button type="primary" long @click="createNewChat">
        <template #icon><icon-plus /></template>
        新建对话
      </a-button>
      <div class="history-list">
        <a-list :bordered="false">
          <transition-group name="list" tag="div" class="list-container">
            <a-list-item
              v-for="item in chatHistory"
              :key="item.memoryId"
              :class="{ 'active': currentChat === item.memoryId }"
            >
              <div class="history-item-wrapper">
                <div class="history-item" @click="switchChat(item.memoryId)">
                  <icon-message class="history-icon" />
                  <div class="title-container">
                    <input
                      v-if="editingId === item.memoryId"
                      ref="titleInput"
                      v-model="editingTitle"
                      class="title-input"
                      @blur="handleTitleUpdate(item.memoryId)"
                      @keyup.enter="handleTitleUpdate(item.memoryId)"
                      @click.stop
                    />
                    <span v-else class="history-title">{{ item.title }}</span>
                  </div>
                </div>
                <a-dropdown @select="(key) => handleMoreActions(key, item)" :popup-max-height="false">
                  <a-button class="more-btn" type="text" size="mini">
                    <icon-more-vertical />
                  </a-button>
                  <template #content>
                    <a-doption value="rename" class="dropdown-option">
                      <div class="option-content">
                        <icon-edit />
                        <span>重命名</span>
                      </div>
                    </a-doption>
                    <a-doption value="delete" class="dropdown-option danger-option">
                      <div class="option-content">
                        <icon-delete />
                        <span>删除</span>
                      </div>
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </a-list-item>
          </transition-group>
        </a-list>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <!-- 知识库选择 -->
      <div class="knowledge-select">
        <a-select
          v-model="selectedKnowledge"
          placeholder="请选择知识库"
          :style="{ width: isMobile ? '100%' : '200px' }"
        >
          <a-option
            v-for="item in knowledgeList"
            :key="item.knowledgeLibId"
            :value="item.knowledgeLibId"
          >
            {{ item.knowledgeLibName }}
          </a-option>
        </a-select>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" ref="messageList">
        <div v-for="(msg, index) in messages" :key="index"
          :class="['message-item', msg.type === 'user' ? 'message-user' : 'message-bot']">
          <a-avatar :style="{ backgroundColor: msg.type === 'user' ? '#3370ff' : '#00b42a' }">
            <icon-user v-if="msg.type === 'user'" />
            <icon-robot v-else />
          </a-avatar>
          <div v-if="msg.type === 'user'" class="message-content">
            {{ msg.content }}
          </div>
          <div v-else class="message-content markdown-body">
            <div v-if="msg.content" v-html="renderMarkdown(msg.content)"></div>
            <div v-else-if="isReceiving" class="loading-bubble">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <input
            type="file"
            id="file-upload"
            style="display: none"
            @change="handleFileUpload"
            accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          />
          <a-button class="attachment-btn" @click="handleAttachmentClick">
            <template #icon><icon-attachment /></template>
          </a-button>
          <div v-if="uploadedFiles.length > 0" class="file-tag">
            <span class="file-name">
              <icon-file /> <span>{{ uploadedFiles[0].fileName }}</span>
            </span>
            <icon-close class="remove-file" @click="removeUploadedFile" />
          </div>
          <a-textarea
            v-model="inputMessage"
            placeholder="请输入您的问题..."
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keypress.enter.prevent="sendMessage"
          />
          <div class="button-group">
            <a-button
              class="web-search-btn"
              :type="isWebSearch ? 'primary' : 'outline'"
              @click="isWebSearch = !isWebSearch"
            >
              <template #icon><icon-search /></template>
            </a-button>
            <a-button class="send-btn" type="primary" @click="sendMessage">
              <template #icon><icon-send /></template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 反馈按钮 -->
      <div class="feedback-button" @click="showFeedbackModal = true">
        <icon-exclamation />
        <span>反馈</span>
      </div>
    </div>

    <!-- 反馈弹窗 -->
    <a-modal
      v-model:visible="showFeedbackModal"
      :modal-style="{ width: '480px' }"
      :mask-style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }"
      unmount-on-close
      :popup-options="{ animation: false }"
    >
      <template #title>
        <span class="feedback-title">问题反馈</span>
      </template>
      <div class="feedback-form">
        <a-form :model="feedbackForm" ref="feedbackFormRef" :style="{ width: '100%' }">
          <div class="form-item-wrapper">
            <span class="required-mark">*</span>
            <span class="form-label">标题</span>
          </div>
          <a-form-item field="title" :rules="[{ required: true, message: '请输入标题' }]" hide-label>
            <a-input v-model="feedbackForm.title" placeholder="请输入标题" allow-clear />
          </a-form-item>

          <div class="form-item-wrapper">
            <span class="required-mark">*</span>
            <span class="form-label">问题描述</span>
          </div>
          <a-form-item field="issueDescription" :rules="[{ required: true, message: '请输入问题描述' }]" hide-label>
            <a-textarea
              v-model="feedbackForm.issueDescription"
              placeholder="请详细描述您遇到的问题或建议"
              :auto-size="{ minRows: 6, maxRows: 8 }"
              allow-clear
            />
          </a-form-item>
        </a-form>
      </div>
      <template #footer>
        <div class="feedback-footer">
          <a-button @click="handleCancelFeedback">取消</a-button>
          <a-button type="primary" @click="handleSubmitFeedback">提交</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { IconPlus, IconMessage, IconUser, IconRobot, IconAttachment, IconSend, IconFile, IconClose, IconDelete, IconEdit, IconSearch, IconExclamation, IconMoreVertical } from '@arco-design/web-vue/es/icon'
import { Message, Modal, Form } from '@arco-design/web-vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import axios from 'axios'
import { useLayoutStore } from '@/stores/layout'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()
const userStore = useUserStore()

const inputMessage = ref('')
const messages = ref([])
const selectedKnowledge = ref(null)
const messageList = ref(null)
const currentChat = ref(null)
const isMobile = ref(window.innerWidth <= 768)
const isReceiving = ref(false)
const chatHistory = ref([])
const uploadedFiles = ref([])
let eventSource = null

// 添加重命名相关的状态
const editingId = ref(null)
const editingTitle = ref('')
const titleInput = ref(null)

// 添加新的响应式变量
const isWebSearch = ref(false)

// 反馈相关的响应式变量
const showFeedbackModal = ref(false)
const feedbackForm = ref({
  title: '',
  issueDescription: ''
})
const feedbackFormRef = ref()

// 修改知识库列表的数据结构
const knowledgeList = ref([])

// 获取知识库列表的方法
const fetchKnowledgeList = async () => {
  try {
    const response = await axios.get('/api/library/queryLibraryList', {
      params: {
        userId: userStore.userId
      }
    })

    if (response.data.code === '200') {
      knowledgeList.value = response.data.data
    } else {
      Message.error(response.data.msg || '获取知识库列表失败')
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    Message.error(error.response?.data?.msg || '获取知识库列表失败')
  }
}

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

// Markdown渲染函数
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return md.render(content)
  } catch (e) {
    console.error('Markdown rendering error:', e)
    return content
  }
}

// 获取聊天历史记录
const fetchChatHistory = async () => {
  try {
    const response = await axios.get(`/api/chat/conversation-history`, {
      params: {
        userId: userStore.userId
      }
    })

    console.log('获取到的会话列表响应:', response.data)

    if (response.data.code === '200') {
      const sessionList = response.data.data
      if (Array.isArray(sessionList)) {
        chatHistory.value = sessionList
        if (sessionList.length > 0 && !currentChat.value) {
          switchChat(sessionList[0].memoryId)
        }
      } else {
        console.error('返回数据格式错误:', sessionList)
        Message.error('获取会话列表失败：数据格式错误')
      }
    } else {
      Message.error(response.data.msg || '获取会话列表失败')
    }
  } catch (error) {
    console.error('获取聊天历史失败:', error)
    Message.error(error.response?.data?.msg || '获取会话列表失败')
  }
}

// 获取对话历史消息
const fetchChatMessages = async (memoryId) => {
  try {
    const response = await axios.get(`/api/chat/messages`, {
      params: {
        memoryId
      }
    })

    if (response.data.code === '200') {
      const messageList = response.data.data
      if (Array.isArray(messageList)) {
        messages.value = messageList.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content
        }))
        scrollToBottom()
      }
    } else {
      Message.error(response.data.msg || '获取历史消息失败')
    }
  } catch (error) {
    console.error('获取历史消息失败:', error)
    Message.error(error.response?.data?.msg || '获取历史消息失败')
  }
}

// 切换对话
const switchChat = async (memoryId) => {
  if (!memoryId) return

  // 更新路由
  await router.push(`/chat/${memoryId}`)

  currentChat.value = memoryId
  messages.value = [] // 清空当前消息
  fetchChatMessages(memoryId) // 获取历史消息
  console.log('切换到对话:', memoryId)
}

// 监听路由参数变化
watch(
  () => route.params.memoryId,
  async (newMemoryId) => {
    if (newMemoryId && newMemoryId !== currentChat.value) {
      currentChat.value = newMemoryId
      messages.value = [] // 清空当前消息
      await fetchChatMessages(newMemoryId) // 获取历史消息
    }
  }
)

// 创建新对话
const createNewChat = async () => {
  try {
    const request = {
      userId: userStore.userId
    }

    console.log('发送创建会话请求，参数：', request)

    const response = await axios.post('/api/chat/conversation-create', request, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('创建会话响应：', response)

    if (response.data.code === '200') {
      const newSession = response.data.data
      if (newSession && newSession.memoryId) {
        chatHistory.value.unshift({
          memoryId: newSession.memoryId,
          title: newSession.title,
          userId: userStore.userId
        })
        await switchChat(newSession.memoryId)
        Message.success('创建成功')
      } else {
        throw new Error('返回数据格式错误')
      }
    } else {
      Message.error(response.data.msg || '创建对话失败')
    }
  } catch (error) {
    console.error('创建对话失败，详细错误：', error.response || error)
    Message.error(error.response?.data?.msg || '创建对话失败')
  }
}

// 文件上传配置
const allowedFileTypes = [
  'text/plain',                 // txt
  'application/pdf',            // pdf
  'application/msword',         // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'image/jpeg',                 // jpg/jpeg
  'image/png',                  // png
  'image/gif',                  // gif
  'image/webp'                  // webp
]
const maxFileSize = 10 * 1024 * 1024  // 10MB

// 添加移除文件的方法
const removeUploadedFile = () => {
  uploadedFiles.value = []
}

// 修改文件上传处理方法
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!allowedFileTypes.includes(file.type)) {
    Message.error('不支持的文件格式，请上传txt、pdf、word或常见图片格式的文件')
    return
  }

  // 验证文件大小
  if (file.size > maxFileSize) {
    Message.error('文件大小不能超过10MB')
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    console.log('开始上传文件:', file.name)
    // 上传文件
    const response = await axios.post('/api/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('文件上传响应:', response.data)

    if (response.data.code === '200') {
      const fileId = response.data.data.fileId
      console.log('文件上传成功，获取到的fileId:', fileId)

      // 将上传成功的文件信息添加到暂存列表
      uploadedFiles.value = [{  // 直接替换而不是追加，因为我们只支持单文件
        fileId: fileId,
        fileName: file.name
      }]
      console.log('当前暂存的文件列表:', uploadedFiles.value)
      Message.success('文件上传成功')
    } else {
      throw new Error(response.data.msg || '上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    Message.error(error.response?.data?.msg || '文件上传失败')
  }

  // 清空文件选择器的值，以便能够重复选择同一个文件
  event.target.value = ''
}

// 处理附件按钮点击
const handleAttachmentClick = () => {
  if (!currentChat.value) {
    Message.warning('请先创建或选择一个对话')
    return
  }
  // 触发隐藏的文件输入框
  document.getElementById('file-upload').click()
}

// 修改发送消息的方法
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isReceiving.value) {
    return
  }

  // 如果没有当前对话,先创建一个新对话
  if (!currentChat.value) {
    try {
      const request = {
        userId: userStore.userId
      }
      const response = await axios.post('/api/chat/conversation-create', request, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (response.data.code === '200') {
        const newSession = response.data.data
        if (newSession && newSession.memoryId) {
          chatHistory.value.unshift({
            memoryId: newSession.memoryId,
            title: newSession.title,
            userId: userStore.userId
          })
          currentChat.value = newSession.memoryId
          await router.push(`/chat/${newSession.memoryId}`)
        } else {
          throw new Error('返回数据格式错误')
        }
      } else {
        throw new Error(response.data.msg || '创建对话失败')
      }
    } catch (error) {
      console.error('创建对话失败:', error)
      Message.error(error.response?.data?.msg || '创建对话失败')
      return
    }
  }

  // 发送消息时自动收起导航栏
  if (!isMobile.value) {
    layoutStore.setCollapsed(true)
  }

  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: inputMessage.value
  })

  const userInput = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()

  try {
    isReceiving.value = true
    // 关闭之前的连接（如果存在）
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    // 获取当前文件ID
    const currentFileId = uploadedFiles.value.length > 0 ? uploadedFiles.value[0].fileId : null
    console.log('当前要发送的文件ID:', currentFileId)
    console.log('当前暂存的文件列表:', uploadedFiles.value)

    // 创建请求数据，添加知识库ID（如果已选择）
    const requestData = {
      userId: userStore.userId,
      userMessage: userInput,
      fileId: currentFileId || null,
      isWebSearchRequest: isWebSearch.value,
      knowledgeLibId: selectedKnowledge.value || null // 知识库ID可选
    }

    console.log('发送的请求数据:', requestData)

    // 创建新的 SSE 连接
    const url = `/api/chat/${currentChat.value}?${new URLSearchParams(Object.fromEntries(
      Object.entries(requestData).filter(([_, value]) => value !== null)
    )).toString()}`
    console.log('完整的请求URL:', url)

    // 发送消息后立即清空文件列表
    uploadedFiles.value = []

    // 创建一个新的消息对象用于存储机器人的响应
    const botMessageIndex = messages.value.length
    messages.value.push({
      type: 'bot',
      content: ''
    })

    // 创建 EventSource 连接
    eventSource = new EventSource(url)

    // 监听完成事件
    eventSource.addEventListener('done', (event) => {
      console.log('收到完成事件:', event)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      isReceiving.value = false
    })

    // 处理常规消息
    eventSource.onmessage = (event) => {
      console.log('收到消息:', event.data)
      try {
        messages.value[botMessageIndex].content += event.data
        scrollToBottom()
      } catch (error) {
        console.error('处理消息失败:', error)
      }
    }

    // 处理错误
    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      isReceiving.value = false
      Message.error('连接出错，请重试')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    Message.error(error.response?.data?.msg || '发送消息失败')
    isReceiving.value = false
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTo({
        top: messageList.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, 100)
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 修改删除对话的方法
const handleDeleteChat = async (memoryId) => {
  try {
    // 使用 await 等待用户确认
    const confirmResult = await new Promise((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除这个对话吗？此操作不可恢复。',
        okText: '删除',
        cancelText: '取消',
        okButtonProps: {
          status: 'danger'
        },
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })

    if (!confirmResult) {
      return
    }

    const response = await axios.post('/api/chat/conversation-delete', {
      memoryId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.code === '200') {
      // 从列表中移除被删除的对话
      chatHistory.value = chatHistory.value.filter(item => item.memoryId !== memoryId)
      Message.success('删除成功')

      // 如果删除的是当前对话，切换到列表中的第一个对话或清空当前对话
      if (currentChat.value === memoryId) {
        if (chatHistory.value.length > 0) {
          await switchChat(chatHistory.value[0].memoryId)
        } else {
          currentChat.value = null
          messages.value = []
        }
      }
    } else {
      throw new Error(response.data.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除对话失败:', error)
    Message.error(error.response?.data?.msg || '删除失败')
  }
}

// 开始编辑标题
const startEditing = async (item) => {
  console.log('开始编辑:', item.memoryId)
  editingId.value = item.memoryId
  editingTitle.value = item.title
  await nextTick()
  const input = document.querySelector('.title-input')
  if (input) {
    input.focus()
  }
}

// 处理标题更新
const handleTitleUpdate = async (memoryId) => {
  if (!editingTitle.value.trim()) {
    editingTitle.value = chatHistory.value.find(item => item.memoryId === memoryId)?.title || ''
    editingId.value = null
    return
  }

  try {
    const response = await axios.post('/api/chat/conversation-title-update', {
      memoryId,
      newTitle: editingTitle.value.trim()
    })

    if (response.data.code === '200') {
      // 更新本地数据
      const chatItem = chatHistory.value.find(item => item.memoryId === memoryId)
      if (chatItem) {
        chatItem.title = editingTitle.value.trim()
      }
      // Message.success('重命名成功')
    } else {
      throw new Error(response.data.msg || '重命名失败')
    }
  } catch (error) {
    console.error('重命名失败:', error)
    //Message.error(error.response?.data?.msg || '重命名失败')
  } finally {
    editingId.value = null
  }
}

// 处理反馈提交
const handleSubmitFeedback = async () => {
  const { validate } = feedbackFormRef.value
  try {
    await validate()
    const response = await axios.post('/api/home/submit-issue', feedbackForm.value)
    Message.success('反馈提交成功，我们会认真处理~')
    if (response.data.code === '200') {
      showFeedbackModal.value = false
      // 重置表单
      feedbackForm.value = {
        title: '',
        issueDescription: ''
      }
    } else {
      throw new Error(response.data.msg || '提交失败')
    }
  } catch (error) {
    if (error.name === 'FormValidateError') {
      return
    }
    console.error('提交反馈失败:', error)
    Message.error(error.response?.data?.msg || '提交失败')
  }
}

// 处理取消反馈
const handleCancelFeedback = () => {
  showFeedbackModal.value = false
  feedbackForm.value = {
    title: '',
    issueDescription: ''
  }
}

// 处理更多操作
const handleMoreActions = (key, item) => {
  switch (key) {
    case 'rename':
      startEditing(item)
      break
    case 'delete':
      handleDeleteChat(item.memoryId)
      break
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  // 获取知识库列表
  await fetchKnowledgeList()
  await fetchChatHistory()

  // 如果路由中有 memoryId，则切换到对应对话
  if (route.params.memoryId) {
    await switchChat(route.params.memoryId)
  }
  // 如果没有 memoryId 但有历史记录，则切换到第一个对话
  else if (chatHistory.value.length > 0) {
    await switchChat(chatHistory.value[0].memoryId)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  position: relative;
  background: var(--color-bg-1);
  transition: all 0.3s ease;
}

.chat-sidebar {
  width: 320px;  /* 调整宽度从260px到320px */
  height: 100%;
  padding: 20px;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-2);
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -8px;  /* 抵消内部padding */
}

.history-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;  /* 增加内边距 */
  border-radius: 6px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  min-height: 52px;  /* 设置最小高度 */
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;  /* 增加图标和文字的间距 */
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding-right: 8px;
}

.history-icon {
  font-size: 20px;  /* 增加图标大小 */
  flex-shrink: 0;
}

.title-container {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 2px;
}

.rename-btn,
.delete-btn {
  opacity: 0;
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
  border: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 4px !important;
  transition: all 0.3s ease !important;
  background: transparent !important;
}

.rename-btn :deep(.arco-icon),
.delete-btn :deep(.arco-icon) {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.history-item-wrapper:hover .rename-btn,
.history-item-wrapper:hover .delete-btn {
  opacity: 1;
}

.rename-btn {
  color: var(--color-text-3) !important;
}

.rename-btn:hover {
  background: var(--color-fill-2) !important;
  color: rgb(var(--primary-6)) !important;
}

.delete-btn {
  color: var(--color-text-3) !important;
}

.delete-btn:hover {
  background: var(--color-fill-2) !important;
  color: rgb(var(--danger-6)) !important;
}

/* 激活状态样式 */
.active .rename-btn,
.active .delete-btn {
  opacity: 1;
  color: rgba(255, 255, 255, 0.85) !important;
}

.active .rename-btn:hover,
.active .delete-btn:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

/* 确保所有按钮中的图标居中显示 */
.attachment-btn,
.web-search-btn,
.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.attachment-btn :deep(svg),
.web-search-btn :deep(svg),
.send-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

/* 确保所有图标垂直居中 */
:deep(.arco-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

/* 文件图标样式 */
.file-name :deep(.arco-icon) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* 移除文件按钮图标样式 */
.remove-file :deep(.arco-icon) {
  width: 12px;
  height: 12px;
}

.rename-btn {
  color: var(--color-text-3);
}

.rename-btn:hover {
  color: rgb(var(--primary-6));
  background: var(--color-fill-2);
}

.title-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 14px;
  color: inherit;
  outline: none;
  transition: all 0.2s ease;
  margin: -3px 0;
  width: calc(100% - 16px);
}

.title-input:hover {
  background: var(--color-fill-2);
  border-color: var(--color-fill-3);
}

.title-input:focus {
  background: var(--color-bg-1);
  border-color: rgb(var(--primary-6));
  box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.1);
  color: var(--color-text-1);
}

/* 激活状态下的输入框样式 */
.active .title-input {
  color: #fff;
  background: transparent;
  border-color: transparent;
}

.active .title-input:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.active .title-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 确保标题文本和输入框垂直对齐 */
.history-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;  /* 增加字体大小 */
  line-height: 1.4;  /* 调整行高 */
  padding: 2px 8px;
  margin: -3px 0;
  border: 1px solid transparent;
  color: inherit;
  max-width: 240px;
}

.delete-btn {
  color: var(--color-text-3);
}

.delete-btn:hover {
  color: rgb(var(--danger-6));
  background: var(--color-fill-2);
}

/* 鼠标悬停时的效果 */
.history-item-wrapper:hover {
  background: var(--color-fill-2);
}

/* 激活状态的样式 */
.active .history-item-wrapper {
  background: rgb(var(--primary-6));
  color: #fff;
}

/* 调整列表项样式 */
.arco-list-item {
  padding: 0 !important;
  border-bottom: none !important;
}

/* 确保图标垂直居中 */
:deep(.arco-icon) {
  display: flex;
  align-items: center;
}

/* 调整滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-track {
  background: transparent;
}

/* 新建对话按钮样式优化 */
:deep(.arco-btn-primary) {
  height: 40px;
  font-size: 14px;
  border-radius: 6px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  position: relative;
  background: var(--color-bg-1);
  transition: all 0.3s ease;
}

.knowledge-select {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-2);
  transition: all 0.3s ease;
}

:deep(.arco-select) {
  border-radius: 8px;
}

:deep(.arco-select:hover) {
  transform: translateY(-1px);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 80px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--color-bg-1);
  transition: all 0.3s ease;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 80%;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease;
  align-items: flex-start;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bot {
  align-self: flex-start;
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
  max-width: 80%;
}

:deep(.arco-avatar) {
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  width: 40px !important;
  height: 40px !important;
  font-size: 20px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-word;
  transition: all 0.3s ease;
  position: relative;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.3px;
}

/* 亮色模式下的样式 */
[arco-theme='light'] .message-bot .message-content {
  background: #ffffff;
  color: var(--color-text-1);
  border: 1px solid var(--color-border-2);
  border-top-left-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

[arco-theme='light'] .message-user .message-content {
  background: #165DFF;
  color: #ffffff;
  border-top-right-radius: 2px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

/* 暗色模式下的样式 */
[arco-theme='dark'] .message-bot .message-content {
  background: var(--color-bg-3);
  color: var(--color-text-1);
  border: 1px solid var(--color-border-3);
  border-top-left-radius: 2px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

[arco-theme='dark'] .message-user .message-content {
  background: var(--color-primary-light-1);
  color: #ffffff;
  border-top-right-radius: 2px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(var(--primary-light-1), 0.25);
}

.message-bot{
  left: 0;
}

.message-user{
  right: 0;
}

/* 修改选择框文字颜色 */
:deep(.arco-select-view) {
  color: var(--color-text-1);
}

/* 修改输入框文字颜色 */
:deep(.arco-textarea) {
  color: var(--color-text-1);
}

/* 修改placeholder颜色 */
:deep(.arco-textarea::placeholder) {
  color: var(--color-text-3);
}

.input-area {
  padding: 12px 20px;
  position: relative;
  background: transparent;
  z-index: 10;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin: 0;
  margin-left: 40px;
  max-width: calc(80% - 40px);
  box-shadow: none;
}

:deep(.arco-textarea-wrapper) {
  border: none;
  background: transparent;
  flex: 1;
  margin: 0;
  padding: 0;
}

:deep(.arco-textarea) {
  padding: 0;
  min-height: 24px;
  max-height: 120px;
  font-size: 15px;
  line-height: 1.6;
  background: transparent;
  resize: none;
}

:deep(.arco-textarea::placeholder) {
  color: #999;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attachment-btn,
.web-search-btn {
  border: none;
  background: transparent;
  padding: 6px;
  color: #666;
  transition: all 0.2s ease;
  border-radius: 50%;
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-btn:hover,
.web-search-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.web-search-btn.arco-btn-primary {
  background: rgba(36, 104, 242, 0.1);
  color: #2468f2;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2468f2;
  border: none;
  color: white;
}

.send-btn:hover {
  background: #1956d8;
}

.file-tag {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  background: transparent;
  margin-right: 8px;
  gap: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  max-width: 140px;
}

.file-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  cursor: pointer;
  font-size: 12px;
  color: #999;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.remove-file:hover {
  color: #666;
}

/* 调整消息列表底部间距 */
.message-list {
  padding-bottom: 80px;
}

@media screen and (max-width: 768px) {
  .chat-sidebar {
    position: fixed;
    left: -320px;  /* 调整宽度从-260px到-320px */
    top: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
    border-radius: 0 12px 12px 0;
  }

  .chat-sidebar-mobile {
    left: 0;
  }

  .chat-main {
    margin-left: 0;
  }

  .input-area {
    padding: 12px 16px;
  }

  .input-wrapper {
    padding: 4px;
  }

  .message-item {
    max-width: 90%;
  }

  .message-list {
    padding: 16px;
  }
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-1);
}

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.markdown-body :deep(code) {
  padding: 2px 4px;
  font-size: 90%;
  color: var(--color-text-2);
  background-color: var(--color-fill-2);
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--color-fill-1);
  border-radius: 6px;
  margin: 8px 0;
}

.markdown-body :deep(pre code) {
  padding: 0;
  font-size: 100%;
  color: inherit;
  background-color: transparent;
  border-radius: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin: 8px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 6px 13px;
  border: 1px solid var(--color-border);
}

.markdown-body :deep(tr:nth-child(2n)) {
  background-color: var(--color-fill-1);
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: var(--color-text-3);
  border-left: 0.25em solid var(--color-border);
  margin: 8px 0;
}

.markdown-body :deep(hr) {
  height: 1px;
  background-color: var(--color-border);
  border: none;
  margin: 16px 0;
}

.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* 引入highlight.js的样式 */
[arco-theme='light'] :deep(.hljs) {
  background: var(--color-fill-1);
  color: var(--color-text-1);
}

[arco-theme='dark'] :deep(.hljs) {
  background: var(--color-fill-2);
  color: var(--color-text-1);
}

#file-upload {
  display: none;
}

.file-tag {
  padding: 4px 10px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-2);
  margin-right: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-3);
  transition: all 0.3s ease;
}

.remove-file:hover {
  color: var(--color-text-1);
}

/* 确保文件图标和文件名在同一行 */
.file-name :deep(.arco-icon) {
  flex-shrink: 0;
}

/* 列表项进入和离开的过渡效果 */
.list-container {
  position: relative;
}

.list-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-leave-active {
  animation: bubble-burst 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  pointer-events: none;
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

@keyframes bubble-burst {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  30% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  60% {
    opacity: 0.6;
    transform: scale(0.9) translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
}

/* 确保列表项有平滑的高度过渡 */
.history-item-wrapper {
  transform-origin: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden;
  will-change: transform, opacity;
}

/* 删除按钮点击时的动画效果 */
.delete-btn:active {
  transform: scale(0.9);
}

/* 加载动画样式 */
.loading-bubble {
  min-width: 60px !important;
  min-height: 32px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px !important;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-3);
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 调整消息内容最小宽度 */
.message-content {
  min-width: 60px;
  min-height: 32px;
}

/* 反馈按钮样式 */
.feedback-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgb(var(--primary-6));
  color: #fff;
  border-radius: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(var(--primary-6), 0.2);
  transition: all 0.3s ease;
  z-index: 100;
}

.feedback-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--primary-6), 0.3);
  background: rgb(var(--primary-7));
}

.feedback-button:active {
  transform: translateY(0);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .feedback-button {
    right: 16px;
    bottom: 16px;
    padding: 8px 16px;
  }
}

/* 反馈弹窗样式 */
:deep(.arco-modal) {
  padding: 0;
}

:deep(.arco-modal-content) {
  padding: 0 20px;
}

.feedback-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.feedback-form {
  padding: 16px 0;
}

.form-item-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.required-mark {
  color: rgb(var(--danger-6));
  font-size: 14px;
  line-height: 1;
}

.form-label {
  font-size: 14px;
  color: var(--color-text-1);
  line-height: 1;
}

:deep(.arco-form-item) {
  margin-bottom: 24px;
}

:deep(.arco-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.arco-form-item-wrapper) {
  width: 100%;
}

:deep(.arco-input-wrapper),
:deep(.arco-textarea-wrapper) {
  width: 100%;
  background-color: var(--color-fill-2);
  border-radius: 0;
}

:deep(.arco-input),
:deep(.arco-textarea) {
  background-color: var(--color-fill-2);
  border: 1px solid var(--color-neutral-3);
  transition: all 0.1s ease;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 0;
}

:deep(.arco-input-wrapper .arco-input-group) {
  border-radius: 0;
}

:deep(.arco-input:hover),
:deep(.arco-textarea:hover) {
  background-color: var(--color-fill-2);
  border-color: rgb(var(--primary-6));
}

:deep(.arco-input:focus),
:deep(.arco-textarea:focus) {
  background-color: var(--color-fill-2);
  border-color: rgb(var(--primary-6));
  box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.1);
}

.feedback-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--color-neutral-3);
}

:deep(.arco-btn) {
  height: 32px;
  padding: 0 16px;
}

/* 暗色模式适配 */
[arco-theme='dark'] :deep(.arco-input-wrapper),
[arco-theme='dark'] :deep(.arco-textarea-wrapper),
[arco-theme='dark'] :deep(.arco-input),
[arco-theme='dark'] :deep(.arco-textarea) {
  background-color: var(--color-fill-2);
  border-color: var(--color-neutral-3);
}

[arco-theme='dark'] :deep(.arco-input:hover),
[arco-theme='dark'] :deep(.arco-textarea:hover) {
  border-color: rgb(var(--primary-6));
}

[arco-theme='dark'] :deep(.arco-btn-default) {
  border-color: var(--color-neutral-3);
  color: var(--color-text-1);
}

[arco-theme='dark'] .feedback-footer {
  border-color: var(--color-neutral-3);
}

.more-btn {
  opacity: 0;
  width: 32px !important;  /* 增加按钮宽度 */
  height: 32px !important;  /* 增加按钮高度 */
  padding: 0 !important;
  border: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 4px !important;
  transition: all 0.3s ease !important;
  background: transparent !important;
  color: var(--color-text-3) !important;
}

.more-btn:hover {
  background: var(--color-fill-2) !important;
  color: rgb(var(--primary-6)) !important;
}

.history-item-wrapper:hover .more-btn {
  opacity: 1;
}

/* 激活状态下的更多按钮样式 */
.active .more-btn {
  opacity: 1;
  color: rgba(255, 255, 255, 0.85) !important;
}

.active .more-btn:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

/* 下拉菜单中的危险操作样式 */
:deep(.danger-option) {
  color: rgb(var(--danger-6)) !important;
}

:deep(.danger-option:hover) {
  background-color: var(--color-danger-light-1) !important;
}

/* 下拉菜单选项样式 */
:deep(.dropdown-option) {
  padding: 8px 12px !important;
  min-height: 40px !important;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.option-content :deep(.arco-icon) {
  font-size: 16px;
  flex-shrink: 0;
}

/* 确保下拉菜单选项内容对齐 */
:deep(.arco-dropdown-option-content) {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>