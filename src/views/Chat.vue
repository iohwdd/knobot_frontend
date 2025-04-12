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
          <a-list-item
            v-for="(item, index) in chatHistory"
            :key="index"
            :class="{ 'active': currentChat === item.id }"
            @click="switchChat(item.id)"
          >
            <div class="history-item">
              <icon-message />
              <span class="history-title">{{ item.title }}</span>
            </div>
          </a-list-item>
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
          <a-option v-for="item in knowledgeList" :key="item.id" :value="item.id">
            {{ item.name }}
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
          <div class="message-content" v-if="msg.type === 'user'">
            {{ msg.content }}
          </div>
          <div class="message-content markdown-body" v-else v-html="renderMarkdown(msg.content)">
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <a-textarea
          v-model="inputMessage"
          placeholder="请输入您的问题..."
          :auto-size="{ minRows: 2, maxRows: 5 }"
          @keypress.enter.prevent="sendMessage"
        />
        <a-button type="primary" @click="sendMessage">
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { IconPlus, IconMessage, IconUser, IconRobot } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const inputMessage = ref('')
const messages = ref([])
const selectedKnowledge = ref(null)
const messageList = ref(null)
const currentChat = ref(null)
const isMobile = ref(window.innerWidth <= 768)
const isReceiving = ref(false)
let eventSource = null

// 模拟数据
const chatHistory = ref([
  { id: 1, title: '对话1' },
  { id: 2, title: '对话2' }
])

const knowledgeList = ref([
  { id: 1, name: '知识库1' },
  { id: 2, name: '知识库2' }
])

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

const createNewChat = () => {
  // 实现新建对话逻辑
  const newChat = {
    id: Date.now(),
    title: '新对话'
  }
  chatHistory.value.unshift(newChat)
  switchChat(newChat.id)
}

const switchChat = (id) => {
  currentChat.value = id
  // 加载对应对话的消息
  messages.value = [] // 这里应该从后端加载对应对话的消息
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isReceiving.value) return

  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: inputMessage.value
  })

  // 添加一个空的机器人消息用于流式显示
  const botMessageIndex = messages.value.length
  messages.value.push({
    type: 'bot',
    content: ''
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

    // 创建新的 SSE 连接
    const url = `/api/chat/stream?input=${encodeURIComponent(userInput)}`
    console.log('Connecting to:', url)

    eventSource = new EventSource(url)

    // 连接建立时的处理
    eventSource.onopen = (event) => {
      console.log('SSE Connection opened')
    }

    // 监听消息事件
    eventSource.addEventListener('message', (event) => {
      console.log('Received message:', event.data)
      if (event.data !== '[DONE]') {
        messages.value[botMessageIndex].content += event.data
        scrollToBottom()
      }
    })

    // 监听完成事件
    eventSource.addEventListener('done', (event) => {
      console.log('Stream completed')
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      isReceiving.value = false
    })

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      isReceiving.value = false
      Message.error('连接出错，请重试')
    }
  } catch (error) {
    console.error('Error:', error)
    Message.error('发送消息失败')
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

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (chatHistory.value.length > 0) {
    switchChat(chatHistory.value[0].id)
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
  width: 260px;
  height: 100%;
  padding: 16px;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
  color: var(--color-text-1);
}

.history-item:hover {
  background: var(--color-fill-2);
  transform: translateX(4px);
}

.history-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-1);
}

.active .history-item {
  background: var(--color-primary-light-1);
  color: white;
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
  padding: 20px;
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
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
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
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-2);
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
}

:deep(.arco-textarea-wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.arco-textarea-wrapper:hover),
:deep(.arco-textarea-wrapper:focus-within) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.arco-btn) {
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 0 24px;
}

:deep(.arco-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.arco-list-item) {
  padding: 4px 0;
}

@media screen and (max-width: 768px) {
  .chat-sidebar {
    position: fixed;
    left: -260px;
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
</style>