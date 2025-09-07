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
          <a-button type="text" size="small" status="danger" @click="showDeleteConfirm(record)">
            删除
          </a-button>
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

    <!-- 登录弹窗 -->
    <LoginModal
      v-model:visible="showLoginModal"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import LoginModal from '@/components/LoginModal.vue'

const router = useRouter()
const userStore = useUserStore()
const createModalVisible = ref(false)
const showLoginModal = ref(false)
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
    const userId = userStore.getUserId();
    if (!userId) {
      Message.error('用户未登录或用户ID无效');
      return;
    }

    const response = await axios.get('/api/library/queryLibraryDetailList', {
      params: {
        userId: userId
      }
    });

    console.log('获取到的知识库列表响应:', response.data);

    if (response.data.code === 200) {
      // 处理返回的数据，格式化时间
      // 确保 response.data.data 存在，如果为空则使用空数组
      const libraryList = response.data.data || [];
      knowledgeList.value = libraryList.map(item => ({
        knowledgeLibId: item.knowledgeLibId,
        knowledgeLibName: item.knowledgeLibName,
        knowledgeLibDesc: item.knowledgeLibDesc,
        documentCount: item.documentCount || 0,
        createTime: item.createTime ? new Date(item.createTime.replace('T', ' ')).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) : '-'
      }));
    } else {
      // 如果请求失败，设置为空数组
      knowledgeList.value = [];
      Message.error(response.data.msg || '获取知识库列表失败');
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error);
    // 发生错误时，也设置为空数组
    knowledgeList.value = [];
    Message.error('获取知识库列表失败');
  }
};

// 初始化获取知识库列表
onMounted(() => {
  // 检查登录状态
  if (userStore.isLoggedIn()) {
    fetchKnowledgeList()
  } else {
    // 未登录时弹出登录窗口并提示
    Message.warning('请先登录后访问知识库')
    showLoginModal.value = true
  }
})

// 监听登录状态变化
watch(
  () => userStore.isLoggedIn(),
  async (isLoggedIn) => {
    console.log('Knowledge页面 - 登录状态变化:', isLoggedIn)
    if (isLoggedIn) {
      // 用户登录后，自动获取知识库列表
      await fetchKnowledgeList()
    } else {
      // 当用户退出登录时，清空知识库列表
      knowledgeList.value = []
    }
  }
)

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginModal.value = false
  Message.success('登录成功')
  // 登录成功后自动获取知识库列表
  fetchKnowledgeList()
}

const showCreateModal = () => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后创建知识库')
    showLoginModal.value = true
    return
  }

  isEdit.value = false
  formData.value = {
    knowledgeLibId: null,
    name: '',
    description: ''
  }
  createModalVisible.value = true
}

const handleCreateConfirm = async (done) => {
  if (!formRef.value) return done(false)

  try {
    // 表单验证
    const validResult = await formRef.value.validate()
    // 如果验证通过，validResult 为 undefined
    if (!validResult) {
      // 验证通过，执行后续请求逻辑
      await submitForm(done)
    } else {
      done(false)
    }
  } catch (errors) {
    // 验证失败
    console.error('表单验证失败:', errors)
    Message.error('请检查表单填写是否正确')
    done(false)
  }
}

// 表单提交逻辑，只有在验证通过后才会调用
const submitForm = async (done) => {
  try {
    const userId = userStore.getUserId();
    if (!userId) {
      Message.error('用户未登录或用户ID无效');
      done(false);
      return;
    }

    let response;
    if (isEdit.value) {
      response = await axios.post('/api/library/updateKnowledgeLib', {
        knowledgeLibId: formData.value.knowledgeLibId,
        knowledgeLibName: formData.value.name.trim(),
        knowledgeLibDesc: formData.value.description.trim(),
        userId: userId
      });
    } else {
      response = await axios.post('/api/library/createKnowledgeLib', {
        knowledgeLibName: formData.value.name.trim(),
        knowledgeLibDesc: formData.value.description.trim(),
        userId: userId
      });
    }

    // 处理响应
    if (response.data.code === 200) {
      Message.success(isEdit.value ? '更新成功' : '创建成功');
      // 刷新知识库列表
      await fetchKnowledgeList();
      resetForm();
      createModalVisible.value = false;
      done(true);
    } else {
      Message.error(response.data.msg || (isEdit.value ? '更新失败' : '创建失败'));
      done(false);
    }
  } catch (error) {
    console.error('请求失败:', error);
    Message.error(error.response?.data?.msg || (isEdit.value ? '更新失败' : '创建失败'));
    done(false);
  }
};

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
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后查看知识库详情')
    showLoginModal.value = true
    return
  }
  router.push(`/knowledge/${knowledgeLibId}`)
}

const editKnowledge = (record) => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后编辑知识库')
    showLoginModal.value = true
    return
  }

  isEdit.value = true
  formData.value = {
    knowledgeLibId: record.knowledgeLibId,
    name: record.knowledgeLibName,
    description: record.knowledgeLibDesc
  }
  createModalVisible.value = true
}

const deleteKnowledge = async (knowledgeLibId) => {
  // 检查登录状态
  if (!userStore.isLoggedIn()) {
    Message.warning('请先登录后删除知识库')
    showLoginModal.value = true
    return
  }

  try {
    const response = await axios.post('/api/library/deleteKnowledgeLib', {
      knowledgeLibId
    })

    if (response.data.code === 200) {
      Message.success('删除成功')
      // 刷新知识库列表
      await fetchKnowledgeList()
    } else {
      throw new Error(response.data.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除知识库失败:', error)
    Message.error(error.response?.data?.msg || '删除失败')
  }
}

const showDeleteConfirm = (record) => {
  Modal.confirm({
    title: '确认删除知识库',
    content: `确定要删除知识库"${record.knowledgeLibName}"吗？\n删除后将同时删除该知识库中的所有文档，此操作不可恢复。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger'
    },
    onOk: () => {
      return deleteKnowledge(record.knowledgeLibId)
    }
  })
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