<template>
  <div class="history-panel">
    <div class="history-header">
      <div class="history-title">
        <el-icon><Clock /></el-icon>
        SQL执行历史
      </div>
      <div class="history-actions">
        <el-button
          type="primary"
          size="small"
          @click="clearHistory"
          :icon="Delete"
        >
          清空历史
        </el-button>
      </div>
    </div>

    <div class="history-content">
      <el-scrollbar height="100%">
        <div v-if="historyList.length === 0" class="no-history">
          <el-empty description="暂无执行历史" />
        </div>
        
        <div
          v-for="(item, index) in historyList"
          :key="index"
          class="history-item"
          @click="selectHistoryItem(item)"
        >
          <div class="history-item-header">
            <div class="history-sql-short">
              {{ getSqlShortText(item.sql) }}
            </div>
            <div class="history-meta">
              <el-tag size="small" type="info" class="history-time">
                {{ formatTime(item.timestamp) }}
              </el-tag>
              <el-tag
                v-if="item.executionTime"
                size="small"
                :type="getExecutionTimeType(item.executionTime)"
                class="history-time"
              >
                {{ item.executionTime }}ms
              </el-tag>
            </div>
          </div>
          
                    <div v-if="item.sql && showFullSql" class="history-sql-full">
            <pre class="sql-text">{{ item.sql }}</pre>
          </div>
          
          <div v-if="item.result && item.result.rows" class="history-result-summary">
            <el-tag size="small" type="success">
              影响行数: {{ item.result.affectedRows || 0 }}
            </el-tag>
            <el-tag size="small" type="info">
              返回行数: {{ item.result.rows.length }}
            </el-tag>
          </div>
          
          <div class="history-actions-item">
            <el-button
              type="primary"
              size="small"
              @click.stop="executeHistoryItem(item)"
              :icon="RefreshRight"
            >
              重新执行
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click.stop="deleteHistoryItem(index)"
              :icon="Close"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Delete, RefreshRight, Close } from '@element-plus/icons-vue'
import { databaseApi } from '../api/api'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['history-select', 'history-execute', 'history-delete', 'history-clear'])

const historyList = ref([])
const showFullSql = ref(false)

// 初始化历史记录
const initHistory = () => {
  historyList.value = props.history || []
}

// 获取SQL简短文本
const getSqlShortText = (sql) => {
  if (!sql) return ''
  return sql.length > 50 ? sql.substring(0, 50) + '...' : sql
}

// 获取执行时间类型
const getExecutionTimeType = (time) => {
  if (time < 100) return 'success'
  if (time < 500) return 'warning'
  return 'danger'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

// 选择历史记录项
const selectHistoryItem = (item) => {
  if (emit) {
    emit('history-select', item)
  }
  // 切换显示完整SQL
  showFullSql.value = !showFullSql.value
}

// 执行历史记录项
const executeHistoryItem = async (item) => {
  if (emit) {
    emit('history-execute', item)
  } else {
    // 直接执行
    try {
      ElMessage.info('正在执行历史SQL...')
      // 这里应该调用父组件的执行方法，暂时模拟
      console.log('执行历史SQL:', item.sql)
    } catch (error) {
      ElMessage.error('执行失败: ' + error.message)
    }
  }
}

// 删除单个历史记录
const deleteHistoryItem = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这条历史记录吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    historyList.value.splice(index, 1)
    
    if (emit) {
      emit('history-delete', index)
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

// 清空所有历史记录
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有历史记录吗？此操作不可恢复。', '确认清空', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    historyList.value = []
    
    if (emit) {
      emit('history-clear')
    }
    
    ElMessage.success('历史记录已清空')
  } catch (error) {
    // 用户取消
  }
}

// 监听props变化
const updateHistory = () => {
  historyList.value = props.history || []
}

// 监听props.history变化
if (props.history) {
  updateHistory()
}

// 初始化
initHistory()
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.history-content {
  flex: 1;
  overflow: hidden;
  padding: 15px;
}

.no-history {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.history-sql-short {
  flex: 1;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: #303133;
  margin-right: 12px;
  word-break: break-all;
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.history-time {
  font-size: 11px;
}

.history-sql-full {
  margin: 8px 0;
  max-height: 100px;
  overflow: hidden;
}

.sql-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.history-result-summary {
  display: flex;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.history-actions-item {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.history-actions-item .el-button {
  flex: 1;
  font-size: 12px;
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

:deep(.el-tag) {
  font-size: 11px;
}
</style>