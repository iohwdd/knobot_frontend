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
        <a-upload
          :custom-request="handleFileUpload"
          :show-file-list="false"
          accept=".pdf,.doc,.docx,.txt"
          @change="handleUploadChange"
        >
          <template #upload-button>
            <a-button type="primary">
              <template #icon><icon-upload /></template>
              上传文档
            </a-button>
          </template>
        </a-upload>
      </div>
    </div>

    <!-- 文档列表 -->
    <a-table :data="documentList" :columns="columns" :pagination="false">
      <template #status="{ record }">
        <a-tag :color="getStatusColor(record.status)">
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>

      <template #operations="{ record }">
        <a-space>
          <a-button
            type="text"
            size="small"
            :disabled="record.status !== 'processed'"
            @click="previewDocument(record)"
          >
            预览
          </a-button>
          <a-popconfirm
            content="确定要删除这个文档吗？"
            @ok="deleteDocument(record.id)"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconUpload } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()
const previewModalVisible = ref(false)
const selectedDocument = ref(null)

// 模拟数据
const knowledgeBase = ref({
  id: 1,
  name: '示例知识库'
})

const columns = [
  {
    title: '文档名称',
    dataIndex: 'name'
  },
  {
    title: '大小',
    dataIndex: 'size'
  },
  {
    title: '上传时间',
    dataIndex: 'uploadTime'
  },
  {
    title: '状态',
    slotName: 'status'
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 150
  }
]

const documentList = ref([
  {
    id: 1,
    name: '示例文档1.pdf',
    size: '1.2MB',
    uploadTime: '2024-04-12 10:00:00',
    status: 'processed',
    content: '这是示例文档1的内容...'
  },
  {
    id: 2,
    name: '示例文档2.docx',
    size: '856KB',
    uploadTime: '2024-04-12 11:00:00',
    status: 'processing'
  }
])

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

const handleFileUpload = (option) => {
  // 实现文件上传逻辑
  const { file, onSuccess, onError } = option

  // 模拟上传
  setTimeout(() => {
    documentList.value.push({
      id: Date.now(),
      name: file.name,
      size: '1MB',
      uploadTime: new Date().toLocaleString(),
      status: 'processing'
    })
    onSuccess()
    Message.success('文件上传成功')
  }, 1000)
}

const handleUploadChange = (fileList) => {
  console.log('fileList:', fileList)
}

const previewDocument = (document) => {
  selectedDocument.value = document
  previewModalVisible.value = true
}

const deleteDocument = async (id) => {
  // 实现删除文档逻辑
  documentList.value = documentList.value.filter(doc => doc.id !== id)
  Message.success('删除成功')
}

onMounted(() => {
  // 获取知识库详情
  const id = route.params.id
  // 实现获取知识库详情逻辑
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
</style>