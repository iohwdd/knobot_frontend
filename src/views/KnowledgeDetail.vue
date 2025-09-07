<template>
  <div class="knowledge-detail">
    <div class="detail-header">
      <div class="header-left">
        <a-button @click="goBack">
          <template #icon><icon-left /></template>
          返回
        </a-button>
        <h2>{{ knowledgeBase.name }}</h2>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showUploadModal">
          <template #icon><icon-upload /></template>
          上传文档
        </a-button>
      </div>
    </div>

    <!-- 文档列表 -->
    <a-table :data="documentList" :columns="columns" :pagination="false">
      <template #operations="{ record }">
        <a-space>
          <a-button
            type="text"
            size="small"
            @click="previewDocument(record)"
          >
            预览
          </a-button>
          <a-button
            type="text"
            size="small"
            @click="showEditModal(record)"
          >
            编辑
          </a-button>
          <a-popconfirm
            content="确定要删除这个文档吗？"
            @ok="deleteDocument(record.documentId)"
            position="left"
          >
            <a-button type="text" size="small" status="danger">
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 文档预览模态框 -->
    <a-modal
      v-model:visible="previewModalVisible"
      title="文档预览"
      :footer="false"
      width="800px"
    >
      <div class="preview-content">
        {{ selectedDocument?.content }}
      </div>
    </a-modal>

    <!-- 上传文档模态框 -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="上传文档"
      @before-ok="handleUploadConfirm"
      @cancel="handleUploadCancel"
      :mask-closable="false"
      :closable="false"
      class="upload-modal"
      :modal-style="{ width: '560px' }"
    >
      <a-form :model="uploadForm" ref="uploadFormRef" class="upload-form">
        <a-form-item
          field="name"
          label="文档名称"
          :rules="[
            { required: true, message: '请输入文档名称' },
            { maxLength: 50, message: '文档名称不能超过50个字符' }
          ]"
        >
          <a-input
            v-model="uploadForm.name"
            placeholder="请输入文档名称"
            :maxLength="50"
            :show-word-limit="true"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="description"
          label="文档描述"
          :rules="[
            { required: true, message: '请输入文档描述' },
            { maxLength: 200, message: '描述不能超过200个字符' }
          ]"
        >
          <a-textarea
            v-model="uploadForm.description"
            placeholder="请输入文档描述"
            :maxLength=200
            :show-word-limit="true"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="file"
          label="选择文件"
          :rules="[{ required: true, message: '请选择要上传的文件' }]"
        >
          <div class="upload-file-area">
            <div v-if="!uploadForm.file" class="upload-placeholder">
              <a-upload
                :custom-request="handleFileUpload"
                :show-file-list="false"
                accept=".md,.txt,.pdf,.doc,.docx"
                :multiple="false"
                @change="handleFileChange"
              >
                <template #upload-button>
                  <div class="upload-button">
                    <icon-upload />
                    <span>点击选择文件</span>
                    <div class="upload-tip">支持 Markdown、TXT、PDF、Word 格式，大小不超过100MB</div>
                  </div>
                </template>
              </a-upload>
            </div>
            <div v-else class="file-info">
              <icon-file />
              <span class="file-name">{{ uploadForm.file.name }}</span>
              <span class="file-size">{{ (uploadForm.file.size / 1024 / 1024).toFixed(2) }}MB</span>
              <icon-close class="remove-file" @click="removeFile" />
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑文档模态框 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑文档"
      @before-ok="handleEditConfirm"
      @cancel="handleEditCancel"
      :mask-closable="false"
      :closable="false"
      class="upload-modal"
      :modal-style="{ width: '560px' }"
    >
      <a-form :model="editForm" ref="editFormRef" class="upload-form">
        <a-form-item
          field="name"
          label="文档名称"
          :rules="[
            { required: true, message: '请输入文档名称' },
            { maxLength: 50, message: '文档名称不能超过50个字符' }
          ]"
        >
          <a-input
            v-model="editForm.name"
            placeholder="请输入文档名称"
            :maxLength="50"
            :show-word-limit="true"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="description"
          label="文档描述"
          :rules="[
            { required: true, message: '请输入文档描述' },
            { maxLength: 200, message: '描述不能超过200个字符' }
          ]"
        >
          <a-textarea
            v-model="editForm.description"
            placeholder="请输入文档描述"
            :maxLength=200
            :show-word-limit="true"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="file"
          label="更新文件（可选）"
        >
          <div class="upload-file-area">
            <div v-if="!editForm.file" class="upload-placeholder">
              <a-upload
                :custom-request="handleFileUpload"
                :show-file-list="false"
                accept=".md,.txt,.pdf,.doc,.docx"
                :multiple="false"
                @change="handleEditFileChange"
              >
                <template #upload-button>
                  <div class="upload-button">
                    <icon-upload />
                    <span>点击选择文件</span>
                    <div class="upload-tip">支持 Markdown、TXT、PDF、Word 格式，大小不超过100MB</div>
                  </div>
                </template>
              </a-upload>
            </div>
            <div v-else class="file-info">
              <icon-file />
              <span class="file-name">{{ editForm.file.name }}</span>
              <span class="file-size">{{ (editForm.file.size / 1024 / 1024).toFixed(2) }}MB</span>
              <icon-close class="remove-file" @click="removeEditFile" />
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 登录弹窗 -->
    <LoginModal
      v-model:visible="showLoginModal"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconUpload, IconFile, IconClose } from '@arco-design/web-vue/es/icon'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import LoginModal from '@/components/LoginModal.vue'

const userStore = useUserStore()
const showLoginModal = ref(false)

const router = useRouter()
const route = useRoute()
const previewModalVisible = ref(false)
const selectedDocument = ref(null)
const uploadModalVisible = ref(false)
const uploadFormRef = ref(null)
const uploadForm = ref({
  name: '',
  description: '',
  file: null
})

const editModalVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  documentId: '',
  name: '',
  description: '',
  file: null
})

// 模拟数据
const knowledgeBase = ref({
  id: 1,
  name: '示例知识库'
})

const columns = [
  {
    title: '文档名称',
    dataIndex: 'documentName',
    width: 250
  },
  {
    title: '描述',
    dataIndex: 'documentDesc',
    ellipsis: true,
    tooltip: true,
    width: 300
  },
  {
    title: '大小',
    dataIndex: 'documentSize',
    width: 100,
    render: ({ record }) => `${record.documentSize}MB`
  },
  {
    title: '上传时间',
    dataIndex: 'uploadTime',
    width: 180
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 150,
    fixed: 'right'
  }
]

const documentList = ref([])

const getStatusColor = (status) => {
  const statusMap = {
    processed: 'green',
    processing: 'blue',
    failed: 'red'
  }
  return statusMap[status]
}

const getStatusText = (status) => {
  const statusMap = {
    processed: '处理完成',
    processing: '处理中',
    failed: '处理失败'
  }
  return statusMap[status]
}

const goBack = () => {
  router.push('/knowledge')
}

const showUploadModal = () => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后上传文档')
    showLoginModal.value = true
    return
  }

  resetUploadForm()
  uploadModalVisible.value = true
}

const handleFileChange = (fileList, event) => {
  console.log('文件变化:', fileList, event)
  if (fileList && fileList.length > 0) {
    const file = fileList[0].file

    // 检查文件大小（限制为100MB）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      Message.error('文件大小不能超过100MB')
      return
    }

    // 检查文件类型
    const allowedTypes = ['.md', '.txt', '.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      Message.error('只支持 Markdown、TXT、PDF、Word 格式的文件')
      return
    }

    // 更新表单数据
    uploadForm.value.file = file
    // 如果用户还没有输入文档名称，就用文件名（不含扩展名）作为默认名称
    if (!uploadForm.value.name) {
      uploadForm.value.name = file.name.split('.').slice(0, -1).join('.')
    }
  }
}

const handleFileUpload = (option) => {
  const { onProgress, onSuccess, onError } = option

  try {
    // 这里实际上不需要真正上传文件，因为我们会在表单提交时一起上传
    onSuccess()
  } catch (error) {
    console.error('文件处理错误:', error)
    onError()
  }
}

const handleUploadConfirm = async (done) => {
  if (!uploadFormRef.value) return done(false)

  try {
    // 表单验证
    const validResult = await uploadFormRef.value.validate()
    // 如果验证通过，validResult 为 undefined
    if (!validResult) {
      // 2. 构建 FormData
      const formData = new FormData()
      // 添加 JSON 数据，使用 requestBody 作为参数名
      formData.append('knowledgeLibId', route.params.id)
      formData.append('documentName', uploadForm.value.name)
      formData.append('documentDesc', uploadForm.value.description)
      // 添加文件
      formData.append('file', uploadForm.value.file)

      // 3. 发送请求
      const response = await axios.post('/api/library/createKnowledgeLibDocument', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 4. 处理响应
      if (response.data.code === 200) {
        Message.success('文档上传成功')
        // 重置表单
        resetUploadForm()
        // 刷新文档列表
        await fetchDocumentList()
        // 关闭模态框
        uploadModalVisible.value = false
        done(true)
      } else {
        throw new Error(response.data.msg || '上传失败')
      }
    } else {
      done(false)
    }
  } catch (error) {
    console.error('上传失败:', error)
    Message.error(error.message || '上传失败')
    done(false)
  }
}

const handleUploadCancel = () => {
  uploadModalVisible.value = false
  resetUploadForm()
}

const resetUploadForm = () => {
  uploadForm.value = {
    name: '',
    description: '',
    file: null
  }
  // 重置表单验证状态
  uploadFormRef.value?.resetFields()
}

const previewDocument = (document) => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后预览文档')
    showLoginModal.value = true
    return
  }

  selectedDocument.value = document
  previewModalVisible.value = true
}

const deleteDocument = async (documentId) => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后删除文档')
    showLoginModal.value = true
    return
  }

  try {
    const response = await axios.post('/api/library/deleteKnowledgeLibDocument', {
      knowledgeLibId: route.params.id,
      documentId: documentId
    })

    if (response.data.code === 200) {
      Message.success('删除成功')
      // 刷新文档列表
      await fetchDocumentList()
    } else {
      throw new Error(response.data.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除文档失败:', error)
    Message.error(error.message || '删除失败')
  }
}

const showEditModal = (document) => {
  editForm.value = {
    documentId: document.documentId,
    name: document.documentName,
    description: document.documentDesc,
    file: null
  }
  editModalVisible.value = true
}

const handleEditFileChange = (fileList, event) => {
  if (fileList && fileList.length > 0) {
    const file = fileList[0].file

    // 检查文件大小（限制为100MB）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      Message.error('文件大小不能超过100MB')
      return
    }

    // 检查文件类型
    const allowedTypes = ['.md', '.txt', '.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      Message.error('只支持 Markdown、TXT、PDF、Word 格式的文件')
      return
    }

    // 更新表单数据
    editForm.value.file = file
  }
}

const removeEditFile = () => {
  editForm.value.file = null
}

const handleEditConfirm = async (done) => {
  if (!editFormRef.value) return done(false)

  try {
    // 表单验证
    const validResult = await editFormRef.value.validate()
    // 如果验证通过，validResult 为 undefined
    if (!validResult) {
      // 2. 构建 FormData
      const formData = new FormData()
      formData.append('documentId', editForm.value.documentId)
      formData.append('documentName', editForm.value.name)
      formData.append('documentDesc', editForm.value.description)
      if (editForm.value.file) {
        formData.append('file', editForm.value.file)
      }

      // 3. 发送请求
      const response = await axios.post('/api/library/updateKnowledgeLibDocument', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 4. 处理响应
      if (response.data.code === 200) {
        Message.success('文档更新成功')
        // 重置表单
        resetEditForm()
        // 刷新文档列表
        await fetchDocumentList()
        // 关闭模态框
        editModalVisible.value = false
        done(true)
      } else {
        throw new Error(response.data.msg || '更新失败')
      }
    } else {
      done(false)
    }
  } catch (error) {
    console.error('更新失败:', error)
    Message.error(error.message || '更新失败')
    done(false)
  }
}

const handleEditCancel = () => {
  editModalVisible.value = false
  resetEditForm()
}

const resetEditForm = () => {
  editForm.value = {
    documentId: '',
    name: '',
    description: '',
    file: null
  }
  // 重置表单验证状态
  editFormRef.value?.resetFields()
}

// 获取文档列表
const fetchDocumentList = async () => {
  try {
    const response = await axios.get('/api/library/queryLibraryDocumentList', {
      params: {
        knowledgeLibId: route.params.id
      }
    })

    if (response.data.code === 200) {
      // 处理时间格式，保持原有的documentId
      documentList.value = response.data.data.map(doc => ({
        ...doc, // 保留所有原始字段，包括documentId
        uploadTime: new Date(doc.uploadTime).toLocaleString()
      }))
    } else {
      Message.error(response.data.msg || '获取文档列表失败')
    }
  } catch (error) {
    console.error('获取文档列表失败:', error)
    Message.error('获取文档列表失败')
  }
}

onMounted(() => {
  // 检查登录状态
  if (userStore.isLoggedIn()) {
    const id = route.params.id
    fetchDocumentList()
  } else {
    // 未登录时弹出登录窗口并提示
    Message.warning('请先登录后访问知识库详情')
    showLoginModal.value = true
  }
})

// 监听登录状态变化
watch(
  () => userStore.isLoggedIn(),
  async (isLoggedIn) => {
    console.log('KnowledgeDetail页面 - 登录状态变化:', isLoggedIn)
    if (isLoggedIn) {
      // 用户登录后，自动获取文档列表
      const id = route.params.id
      await fetchDocumentList()
    } else {
      // 当用户退出登录时，清空文档列表
      documentList.value = []
    }
  }
)

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginModal.value = false
  Message.success('登录成功')
  // 登录成功后自动获取文档列表
  const id = route.params.id
  fetchDocumentList()
}

// 在组件卸载时清理
onUnmounted(() => {
  resetUploadForm()
})
</script>

<style scoped>
.knowledge-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: var(--color-fill-2);
  border-radius: 4px;
  white-space: pre-wrap;
}

/* 上传模态框样式 */
:deep(.upload-modal .arco-modal-header) {
  padding: 20px 32px;
  border-bottom: 1px solid var(--color-neutral-3);
}

:deep(.upload-modal .arco-modal-body) {
  padding: 32px 40px;
}

:deep(.upload-modal .arco-modal-footer) {
  padding: 20px 32px;
  border-top: 1px solid var(--color-neutral-3);
}

/* 上传表单样式 */
:deep(.upload-form .arco-form-item) {
  margin-bottom: 32px;
}

:deep(.upload-form .arco-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.upload-form .arco-form-item-label-col) {
  padding-bottom: 12px;
  font-size: 14px;
  color: var(--color-text-2);
}

:deep(.upload-form .arco-input),
:deep(.upload-form .arco-textarea) {
  border-radius: 8px;
  font-size: 14px;
  padding: 10px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

:deep(.upload-form .arco-input:focus),
:deep(.upload-form .arco-input:hover),
:deep(.upload-form .arco-textarea:focus),
:deep(.upload-form .arco-textarea:hover) {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 2px 4px rgba(var(--primary-6), 0.1);
}

:deep(.upload-form .arco-input-word-limit) {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 8px;
  text-align: right;
  padding-right: 4px;
}

/* 文件上传区域样式 */
.upload-file-area {
  border: 1px dashed var(--color-neutral-3);
  border-radius: 8px;
  transition: all 0.2s;
}

.upload-file-area:hover {
  border-color: rgb(var(--primary-6));
}

.upload-placeholder {
  padding: 24px;
  text-align: center;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-2);
  cursor: pointer;
}

.upload-button :deep(.arco-icon) {
  font-size: 24px;
  color: rgb(var(--primary-6));
}

.upload-button .upload-tip {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--color-fill-2);
  border-radius: 8px;
}

.file-info :deep(.arco-icon) {
  font-size: 20px;
  color: rgb(var(--primary-6));
  margin-right: 8px;
}

.file-info .file-name {
  flex: 1;
  color: var(--color-text-1);
  margin-right: 8px;
}

.file-info .file-size {
  color: var(--color-text-3);
  margin-right: 8px;
}

.file-info .remove-file {
  font-size: 16px;
  color: var(--color-text-3);
  cursor: pointer;
  transition: color 0.2s;
}

.file-info .remove-file:hover {
  color: rgb(var(--danger-6));
}
</style>