<template>
  <div class="result-area">
    <div class="result-header">
      <div class="result-tabs">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="结果" name="results">
            <template #label>
              <span>
                结果 
                <el-badge v-if="resultSet && resultSet.rows && resultSet.rows.length > 0" 
                          :value="resultSet.rows.length" 
                          class="item" />
              </span>
            </template>
          </el-tab-pane>
          
          <el-tab-pane label="消息" name="messages">
            <template #label>
              <span>
                消息
                <el-badge v-if="messageCount > 0" 
                          :value="messageCount" 
                          class="item" />
              </span>
            </template>
          </el-tab-pane>
          
          <!-- <el-tab-pane label="历史" name="history">
            <template #label>
              <span>
                历史
                <el-badge v-if="historyCount > 0" 
                          :value="historyCount" 
                          class="item" />
              </span>
            </template>
          </el-tab-pane> -->
        </el-tabs>
      </div>
      
      <!-- <div class="result-actions" v-if="activeTab === 'results' && resultSet">
        <el-button
          size="small"
          @click="exportResults"
          :icon="Download"
          :disabled="resultSet.rows.length === 0"
        >
          导出
        </el-button>
      </div> -->
    </div>

    <div class="result-content">
      <!-- 结果标签页 -->
      <div v-show="activeTab === 'results'" class="results-tab">
        <div v-if="executing" class="executing">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>执行中...</span>
        </div>
        
        <div v-else-if="resultSet && resultSet.rows && resultSet.rows.length > 0" class="table-results">
          <!-- 表格头部信息 -->
          <div class="result-info" v-if="resultSet.executionTime">
            <el-tag size="small" type="info">
              影响行数: {{ resultSet.affectedRows || 0 }}
            </el-tag>
            <el-tag size="small" type="success">
              查询时间: {{ resultSet.executionTime }}ms
            </el-tag>
            <el-tag size="small" type="warning">
              返回行数: {{ resultSet.rows.length }}
            </el-tag>
          </div>
          
          <!-- 数据表格 -->
          <el-table
            :data="resultSet.rows"
            stripe
            border
            max-height="400"
            v-loading="loading"
          >
            <el-table-column
              v-for="(column, index) in resultSet.columns"
              :key="index"
              :prop="column"
              :label="column"
              min-width="120"
              show-overflow-tooltip
            />
          </el-table>
          
          <!-- 分页（如果需要） -->
          <div v-if="resultSet.rows.length > 0" class="pagination-info">
            共 {{ resultSet.rows.length }} 条记录
          </div>
        </div>
        
        <div v-else-if="executed && (!resultSet || (resultSet.rows && resultSet.rows.length === 0))" class="no-results">
          <el-empty description="暂无数据返回" />
        </div>
      </div>

      <!-- 消息标签页 -->
      <div v-show="activeTab === 'messages'" class="messages-tab">
        <el-scrollbar height="100%">
          <div v-if="messages.length === 0" class="no-messages">
            <el-empty description="暂无消息" />
          </div>
          <div v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message-item"
              :class="`message-${message.type}`"
            >
              <el-tag :type="getMessageTagType(message.type)" size="small">
                {{ getMessageTypeLabel(message.type) }}
              </el-tag>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 历史标签页 -->
      <div v-show="activeTab === 'history'" class="history-tab">
        <HistoryPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Loading } from '@element-plus/icons-vue'
import HistoryPanel from './HistoryPanel.vue'

const props = defineProps({
  resultSet: Object,
  executing: Boolean,
  executed: Boolean,
  executionTime: Number,
  affectedRows: Number,
  messages: {
    type: Array,
    default: () => []
  },
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['export-results'])

const activeTab = ref('results')

// 统计数据
const messageCount = computed(() => props.messages.filter(m => m.type !== 'success').length)
const historyCount = computed(() => props.history.length)

const executing = ref(false)
const loading = ref(false)

// 结果数据
const resultSet = reactive({
  columns: [],
  rows: [],
  executionTime: 0,
  affectedRows: 0
})

// 导出结果
const exportResults = () => {
  if (!props.resultSet || !props.resultSet.rows || props.resultSet.rows.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  emit('export-results', props.resultSet)
  ElMessage.success('导出功能开发中...')
}

// 获取消息标签类型
const getMessageTagType = (type) => {
  const types = {
    error: 'danger',
    warning: 'warning',
    success: 'success',
    info: 'info'
  }
  return types[type] || 'info'
}

// 获取消息类型标签
const getMessageTypeLabel = (type) => {
  const labels = {
    error: '错误',
    warning: '警告',
    success: '成功',
    info: '信息'
  }
  return labels[type] || '信息'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

// 初始化结果数据
const initResultSet = () => {
  resultSet.columns = []
  resultSet.rows = []
  resultSet.executionTime = 0
  resultSet.affectedRows = 0
}

// 监听props变化
const updateResultSet = () => {
  if (props.resultSet) {
    resultSet.columns = props.resultSet.columns || []
    resultSet.rows = props.resultSet.rows || []
    resultSet.executionTime = props.executionTime || 0
    resultSet.affectedRows = props.affectedRows || 0
  }
}

// 监听props
if (props.resultSet) {
  updateResultSet()
}

// 监听props.resultSet变化
// 注意：由于Vue3的响应式限制，这里使用watch或者在父组件中直接更新resultSet对象
// 为了简化，我们在父组件中直接操作resultSet对象
</script>

<style scoped>
.result-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.result-tabs {
  flex: 1;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-tab {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

.executing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #409eff;
}

.table-results {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-info {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-info {
  margin-top: 10px;
  text-align: right;
  color: #666;
  font-size: 12px;
}

.no-results {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages-tab {
  flex: 1;
  height: 100%;
}

.no-messages {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.message-item:last-child {
  border-bottom: none;
}

.message-content {
  flex: 1;
}

.message-text {
  margin-bottom: 4px;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.history-tab {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.item {
  margin-left: 4px;
}

:deep(.el-tabs__header) {
  margin: 0 0 10px 0;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
}
</style>