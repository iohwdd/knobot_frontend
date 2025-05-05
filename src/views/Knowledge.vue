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
        <a @click="goToDetail(record.knowledgeLibId)">{{ record.knowledgeLibName }}</a>
      </template>

      <template #operations="{ record }">
        <a-space>
          <a-button type="text" size="small" @click="goToDetail(record.knowledgeLibId)">
            查看
          </a-button>
          <a-button type="text" size="small" @click="editKnowledge(record)">
            编辑
          </a-button>
          <a-popconfirm
            content="确定要删除这个知识库吗？"
            @ok="deleteKnowledge(record.knowledgeLibId)"
          >
            <a-button type="text" size="small" status="danger">
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 创建/编辑知识库模态框 -->
    <a-modal
      v-model:visible="createModalVisible"
      :title="isEdit ? '编辑知识库' : '创建知识库'"
      @before-ok="handleCreateConfirm"
      @cancel="handleCreateCancel"
      :modal-style="{ width: '560px' }"
      class="knowledge-modal"
    >
      <a-form :model="formData" ref="formRef" class="knowledge-form">
        <a-form-item
          field="name"
          label="知识库名称"
          :rules="[
            { required: true, message: '请输入知识库名称' },
            { maxLength: 10, message: '知识库名称不能超过10个字符' }
          ]"
        >
          <a-input
            v-model="formData.name"
            placeholder="请输入知识库名称"
            :maxLength="10"
            :show-word-limit="true"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          field="description"
          label="描述"
          :rules="[
            { required: true, message: '请输入知识库描述' },
            { maxLength: 100, message: '描述不能超过100个字符' }
          ]"
        >
          <a-textarea
            v-model="formData.description"
            placeholder="请输入知识库描述"
            :maxLength="100"
            :show-word-limit="true"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import axios from 'axios'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const createModalVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const formData = ref({
  knowledgeLibId: null,
  name: '',
  description: ''
})

// 表格列定义
const columns = [
  {
    title: '知识库名称',
    dataIndex: 'knowledgeLibName',
    slotName: 'name',
    width: 200
  },
  {
    title: '描述',
    dataIndex: 'knowledgeLibDesc',
    ellipsis: true,
    tooltip: true,
    width: 300
  },
  {
    title: '文档数量',
    dataIndex: 'documentCount',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180
  },
  {
    title: '操作',
    slotName: 'operations',
    width: 200,
    fixed: 'right'
  }
]

// 初始化空列表
const knowledgeList = ref([])

// 获取知识库列表
const fetchKnowledgeList = async () => {
  try {
    const response = await axios.get('/api/library/queryLibraryDetailList', {
      params: {
        userId: userStore.getUserId
      }
    })

    if (response.data.code === '200') {
      // 处理返回的数据，格式化时间
      knowledgeList.value = response.data.data.map(item => ({
        ...item,
        createTime: new Date(item.createTime).toLocaleString()
      }))
    } else {
      Message.error(response.data.msg || '获取知识库列表失败')
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    Message.error('获取知识库列表失败')
  }
}

// 初始化获取知识库列表
onMounted(() => {
  fetchKnowledgeList()
})

const showCreateModal = () => {
  isEdit.value = false
  formData.value = {
    knowledgeLibId: null,
    name: '',
    description: ''
  }
  createModalVisible.value = true
}

const handleCreateConfirm = async (done) => {
  try {
    // 1. 先进行表单验证
    await formRef.value.validate()

    // 2. 发送请求
    let response
    if (isEdit.value) {
      response = await axios.post('/api/library/updateKnowledgeLib', {
        knowledgeLibId: formData.value.knowledgeLibId,
        knowledgeLibName: formData.value.name,
        knowledgeLibDesc: formData.value.description,
        userId: userStore.getUserId
      })
    } else {
      response = await axios.post('/api/library/createKnowledgeLib', {
        knowledgeLibName: formData.value.name,
        knowledgeLibDesc: formData.value.description,
        userId: userStore.getUserId
      })
    }

    // 3. 处理响应
    if (response.data.code === '200') {
      Message.success(isEdit.value ? '更新成功' : '创建成功')
      // 刷新知识库列表
      await fetchKnowledgeList()
      resetForm()
      createModalVisible.value = false
      done(true)
    } else {
      Message.error(response.data.msg || (isEdit.value ? '更新失败' : '创建失败'))
      done(false)
    }
  } catch (error) {
    // 4. 错误处理
    if (error.name === 'FormValidationError') {
      // 表单验证错误
      Message.error('请检查表单填写是否正确')
    } else {
      // API 请求错误
      console.error('操作失败:', error)
      Message.error(error.response?.data?.msg || (isEdit.value ? '更新失败' : '创建失败'))
    }
    done(false)
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    knowledgeLibId: null,
    name: '',
    description: ''
  }
}

const handleCreateCancel = () => {
  formData.value = {
    knowledgeLibId: null,
    name: '',
    description: ''
  }
  createModalVisible.value = false
}

const goToDetail = (knowledgeLibId) => {
  router.push(`/knowledge/${knowledgeLibId}`)
}

const editKnowledge = (record) => {
  isEdit.value = true
  formData.value = {
    knowledgeLibId: record.knowledgeLibId,
    name: record.knowledgeLibName,
    description: record.knowledgeLibDesc
  }
  createModalVisible.value = true
}

const deleteKnowledge = async (knowledgeLibId) => {
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

/* 模态框样式 */
:deep(.knowledge-modal .arco-modal-header) {
  padding: 20px 32px;
  border-bottom: 1px solid var(--color-neutral-3);
}

:deep(.knowledge-modal .arco-modal-body) {
  padding: 32px 40px;
}

:deep(.knowledge-modal .arco-modal-footer) {
  padding: 20px 32px;
  border-top: 1px solid var(--color-neutral-3);
}

/* 表单样式 */
:deep(.knowledge-form .arco-form-item) {
  margin-bottom: 32px;
}

:deep(.knowledge-form .arco-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.knowledge-form .arco-form-item-label-col) {
  padding-bottom: 12px;
  font-size: 14px;
  color: var(--color-text-2);
}

:deep(.knowledge-form .arco-input),
:deep(.knowledge-form .arco-textarea) {
  border-radius: 8px;
  font-size: 14px;
  padding: 10px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

:deep(.knowledge-form .arco-textarea) {
  min-height: 120px !important;
  line-height: 1.6;
}

:deep(.knowledge-form .arco-input:focus),
:deep(.knowledge-form .arco-input:hover),
:deep(.knowledge-form .arco-textarea:focus),
:deep(.knowledge-form .arco-textarea:hover) {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 2px 4px rgba(var(--primary-6), 0.1);
}

:deep(.knowledge-form .arco-input-word-limit) {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 8px;
  text-align: right;
  padding-right: 4px;
}
</style>