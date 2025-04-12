<template>
  <div class="knowledge-container">
    <div class="knowledge-header">
      <h2>知识库管理</h2>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><icon-plus /></template>
        创建知识库
      </a-button>
    </div>

    <!-- 知识库列表 -->
    <a-table :data="knowledgeList" :columns="columns" :pagination="false">
      <template #name="{ record }">
        <a @click="goToDetail(record.id)">{{ record.name }}</a>
      </template>

      <template #operations="{ record }">
        <a-space>
          <a-button type="text" size="small" @click="goToDetail(record.id)">
            查看
          </a-button>
          <a-button type="text" size="small" @click="editKnowledge(record)">
            编辑
          </a-button>
          <a-popconfirm
            content="确定要删除这个知识库吗？"
            @ok="deleteKnowledge(record.id)"
          >
            <a-button type="text" size="small" status="danger">
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 创建知识库模态框 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="创建知识库"
      @ok="handleCreateConfirm"
      @cancel="handleCreateCancel"
    >
      <a-form :model="formData" ref="formRef">
        <a-form-item field="name" label="知识库名称" :rules="[{ required: true }]">
          <a-input v-model="formData.name" placeholder="请输入知识库名称" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea
            v-model="formData.description"
            placeholder="请输入知识库描述"
            :auto-size="{ minRows: 2, maxRows: 5 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const createModalVisible = ref(false)
const formRef = ref(null)
const formData = ref({
  name: '',
  description: ''
})

// 表格列定义
const columns = [
  {
    title: '知识库名称',
    dataIndex: 'name',
    slotName: 'name'
  },
  {
    title: '文档数量',
    dataIndex: 'documentCount'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime'
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 200
  }
]

// 模拟数据
const knowledgeList = ref([
  {
    id: 1,
    name: '示例知识库1',
    documentCount: 5,
    createTime: '2024-04-12 10:00:00'
  },
  {
    id: 2,
    name: '示例知识库2',
    documentCount: 3,
    createTime: '2024-04-12 11:00:00'
  }
])

const showCreateModal = () => {
  createModalVisible.value = true
}

const handleCreateConfirm = async () => {
  const { validate } = formRef.value
  try {
    await validate()
    // 实现创建知识库逻辑
    Message.success('创建成功')
    createModalVisible.value = false
  } catch (error) {
    // 表单验证失败
  }
}

const handleCreateCancel = () => {
  formData.value = {
    name: '',
    description: ''
  }
  createModalVisible.value = false
}

const goToDetail = (id) => {
  router.push(`/knowledge/${id}`)
}

const editKnowledge = (record) => {
  // 实现编辑知识库逻辑
}

const deleteKnowledge = async (id) => {
  // 实现删除知识库逻辑
  Message.success('删除成功')
}
</script>

<style scoped>
.knowledge-container {
  padding: 20px;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.knowledge-header h2 {
  margin: 0;
}
</style>