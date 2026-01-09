<template>
  <div>
    <!-- 慢查询按钮 -->
    <el-button @click="dialogVisible = true" type="primary" size="small">
      慢查询
    </el-button>
    
    <!-- 慢查询对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="慢查询列表"
      width="90%"
      destroy-on-close
    >
      <el-card>
        <template #header>
          <div class="card-header">
            <span>慢查询信息</span>
            <el-button type="primary" @click="loadSlowQueries">刷新</el-button>
          </div>
        </template>
        <div class="table-wrapper">
          <el-table :data="slowQueries" stripe height="600px" style="min-width: 800px">
            <el-table-column prop="pid" label="进程ID" />
            <el-table-column prop="query" label="查询语句" width="500px">
              <template #default="{ row }">
                <el-popover
                  placement="top"
                  title="完整查询语句"
                  width="600px"
                  trigger="hover"
                >
                  <template #reference>
                    <span class="query-text">{{ row.query || '无查询语句' }}</span>
                  </template>
                  {{ row.query || '无查询语句' }}
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column prop="backend_start" label="后端启动时间" />
            <el-table-column prop="query_start" label="查询开始时间" />
            <el-table-column prop="xact_start" label="事务开始时间" />
            <el-table-column prop="xact_stay" label="事务持续时间" />
            <el-table-column prop="query_stay" label="查询持续时间" />
            <el-table-column prop="state" label="状态">
              <template #default="{ row }">
                <el-tag :type="stateColorMap[row.state] || 'info'">
                  {{ row.state }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted,onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { databaseApi } from '@/api/api.js'
import { useConnStore } from '@/stores/conn'

const connStore = useConnStore()
const dialogVisible = ref(false)
const slowQueries = ref([])

// 状态颜色映射
const stateColorMap = {
  active: 'primary',
  idle: 'success',
  waiting: 'warning',
  idle_in_transaction: 'info',
  disabled: 'danger'
}

// 加载慢查询数据
async function loadSlowQueries() {
  if (!connStore.currentConnection) {
    ElMessage.warning('请先连接数据库')
    return
  }
  
  try {
    const params = {
      dbName: connStore.currentConnection.dbName,
      dbHost: connStore.currentConnection.dbHost,
      user: connStore.currentConnection.user,
      password: connStore.currentConnection.password
    }
    
    const response = await databaseApi.getslowquery(params)
    if (response.code === 200) {
      slowQueries.value = response.data || []
    } else {
      ElMessage.error(`加载慢查询失败: ${response.message || '未知错误'}`)
    }
  } catch (error) {
    // console.error('加载慢查询请求失败:', error)
    ElMessage.error('加载慢查询请求失败')
  }
}

// 对话框打开时加载数据
const handleOpen = () => {
  loadSlowQueries()
}

// 监听对话框显示变化
const unwatch = watch(dialogVisible, (newVal) => {
  if (newVal) {
    handleOpen()
  }
})

// 组件卸载时清理监听
onUnmounted(() => {
  unwatch()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
}

.query-text {
  max-width: 480px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: #DCE7FF !important;
}

:deep(.el-table th) {
  background-color: #DCE7FF !important;
}
</style>