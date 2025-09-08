<template>
  <div class="result-area">
    <div class="result-header">
      <div class="result-tabs">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="结果" name="results">
            <template #label>
              <span>
                结果
                <!-- <el-badge
                  v-if="resultSet.rows.length > 0"
                  :value="resultSet.rows.length"
                  class="item"
                /> -->
              </span>
            </template>
          </el-tab-pane>

          <el-tab-pane label="消息" name="messages">
            <template #label>
              <span>
                消息
                <!-- <el-badge
                  v-if="messageCount > 0"
                  :value="messageCount"
                  class="item"
                /> -->
              </span>
            </template>
          </el-tab-pane>

          <!-- <el-tab-pane label="历史" name="history">
            <template #label>
              <span>
                历史
                <el-badge
                  v-if="historyCount > 0"
                  :value="historyCount"
                  class="item"
                />
              </span>
            </template>
          </el-tab-pane> -->
        </el-tabs>
      </div>
    </div>

    <div class="result-content">
      <!-- 结果面板 -->
      <div v-show="activeTab === 'results'" class="results-tab">
        <div v-if="executing" class="executing">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>执行中...</span>
        </div>

        <div
          v-else-if="resultSet.rows.length > 0"
          class="table-results"
        >
          <div class="result-info">
            <el-tag size="small" type="info">
              影响行数: {{ resultSet.affectedRows }}
            </el-tag>
            <el-tag size="small" type="success">
              查询时间: {{ resultSet.executionTime }}ms
            </el-tag>
            <el-tag size="small" type="warning">
              返回行数: {{ resultSet.rows.length }}
            </el-tag>
          </div>

          <!-- ✅ vxe-grid 自适应高度 -->
          <div class="grid-wrapper">
            <vxe-grid
              border
              stripe
              width="100%"
              height="100%"
              :data="resultSet.rows"
              :columns="gridColumns"
            />
          </div>
        </div>
      </div>

      <!-- 消息面板 -->
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

      <!-- 历史面板 -->
      <div v-show="activeTab === 'history'" class="history-tab">
        <HistoryPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import HistoryPanel from './HistoryPanel.vue'

// mock 结果集
const resultSet = reactive({
  columns: ['id', 'name', 'age'],
  rows: [
    { id: 1, name: 'Tom', age: 18 },
    { id: 2, name: 'Jerry', age: 20 },
    { id: 3, name: 'Alice', age: 22 }
  ],
  executionTime: 120,
  affectedRows: 3
})

// vxe-grid 列定义
const gridColumns = ref(
  resultSet.columns.map(col => ({
    field: col,
    title: col,
    minWidth: 120,
    showOverflow: true
  }))
)

// mock 消息
const messages = ref([
  { type: 'success', content: '执行成功', timestamp: Date.now() },
  { type: 'info', content: '查询完成', timestamp: Date.now() }
])

// mock 历史
const history = ref([
  { sql: 'SELECT * FROM users;', time: Date.now() },
  { sql: 'DELETE FROM users WHERE id=1;', time: Date.now() }
])

const executing = ref(false)
const activeTab = ref('results')

// 统计数据
const messageCount = computed(() => messages.value.filter(m => m.type !== 'success').length)
const historyCount = computed(() => history.value.length)

// 工具方法
const getMessageTagType = (type) => {
  const types = { error: 'danger', warning: 'warning', success: 'success', info: 'info' }
  return types[type] || 'info'
}
const getMessageTypeLabel = (type) => {
  const labels = { error: '错误', warning: '警告', success: '成功', info: '信息' }
  return labels[type] || '信息'
}
const formatTime = (timestamp) => new Date(timestamp).toLocaleString()
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

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ✅ 让结果面板能占满 */
.results-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow: hidden;
}

.table-results {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ✅ 表格容器撑开高度 */
.grid-wrapper {
  flex: 1;
  min-height: 300px;
}

.result-info {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.no-results {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
