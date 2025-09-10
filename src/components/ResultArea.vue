<template>
  <div class="result-area">
    <div class="result-header">
      <div class="result-tabs">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="结果" name="results">
            <template #label>
              <span>
                结果
              </span>
            </template>
          </el-tab-pane>

          <!-- <el-tab-pane label="消息" name="messages">
            <template #label>
              <span>
                消息
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
          <!-- ✅ vxe-grid 自适应高度 -->
          <div class="grid-wrapper">
                <vxe-grid
                  v-if="resultSet.columns.length"
                  ref="xGrid"
                  :data="resultSet.rows"
                  :columns="gridColumns"          
                  :edit-config="{ trigger: 'click', mode: 'row', showStatus: true }"
                  border
                  stripe
                  height="99%"
                  size="mini"
                  highlight-hover-row
                  auto-resize>
                </vxe-grid>

          </div>
        </div>
      </div>

      <!-- 消息面板 -->
      <div v-show="activeTab === 'messages'" class="messages-tab">
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
        <!-- <el-scrollbar height="100%">
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
        </el-scrollbar> -->
      </div>

      <!-- 历史面板 -->
      <div v-show="activeTab === 'history'" class="history-tab">
        <HistoryPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick,onMounted,watch  } from 'vue'
import { VXETable } from 'vxe-table'
import { databaseApi } from '@/api/api.js'
import { Loading } from '@element-plus/icons-vue'
import HistoryPanel from './HistoryPanel.vue'


import { useSqlStore } from '@/stores/sqlStore'

const sqlStore = useSqlStore()

const localData = ref({ sql: '', result: null })

watch(
  () => sqlStore.data,
  (newVal) => {
    console.log('SQL 执行更新:', newVal)
    localData.value = newVal
  },
  { immediate: true }
)

onMounted(() => {
  loadResult({ sql: 'select * from user' })
})
/* ==========  2. 响应式结果集  ========== */
const resultSet = reactive({
  columns: [],          // 动态列元数据
  rows: [],             // 真正数据
  executionTime: 0,
  affectedRows: 0
})

/* ==========  3. 把后端字段转成 vxe-columns  ========== */
const gridColumns = computed(() =>
  resultSet.columns.map(col => ({
    field: col,
    title: col,
    minWidth: 100,
    editRender: { name: 'input' }   // 如果想整表可编辑就留着
  }))
)


/* ==========  4. 加载数据  ========== */
// 父组件可以调用 loadResult({ sql: 'select * from user' })
const loadResult = async (parm) => {
  executing.value = true
  try {
    // const res = await databaseApi.getdata(parm)   // ← 你的接口
    // 假定后端返回格式：
    let res = { columns:['id','name','age'], data:[{id:1,name:'a'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:3,name:'cc'},{id:3,name:'cc'},{id:3,name:'cc'},{id:4,name:'dd'}], executionTime:88, affectedRows:2 }
    console.log('table res',res)
    resultSet.columns = res.columns || []
    resultSet.rows    = res.data || []
    resultSet.executionTime = res.executionTime || 0
    resultSet.affectedRows  = res.affectedRows || 0
    // await nextTick()
    // VXETable.modal.message({ content: '查询完成', status: 'success' })
  } catch (e) {
    // VXETable.modal.message({ content: e.message || '查询失败', status: 'error' })
  } finally {
    executing.value = false
  }
}

/* ==========  5. 暴露给父组件  ========== */
defineExpose({ loadResult })
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

// console.log('activeTab', activeTab.value)

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
.grid-wrapper {
  flex: 1;
  min-height: 420px;
  padding: 8px;
  overflow-y: auto;
}

</style>
