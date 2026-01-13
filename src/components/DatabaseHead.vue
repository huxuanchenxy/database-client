<template>

    <div class="tree-header">
      <div class="connection-container">
        <el-button
          type="primary"
          @click="handleRequestConnection"
          :icon="Plus"
        >
          增加实例配置
        </el-button>
        <div v-if="currentConnection" class="connection-info">
            <span class="dot" :class="{ 'green': currentConnection.isConnected, 'yellow': !currentConnection.isConnected }"></span>
            <span>{{ currentConnection.connectionName }} - {{ currentConnection.dbName }}</span>
          </div>
        <div v-else class="connection-info">
          <span class="dot yellow"></span>
          <span>未连接</span>
        </div>
      </div>
    </div>

</template>

<script setup>
import { ref, onMounted,watch,reactive  } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import { useConnStore } from '@/stores/conn'
import { useTreeStore } from '@/stores/treeStore'
import { databaseApi } from '@/api/api'
const treeStore = useTreeStore()
const connStore = useConnStore()
const emit = defineEmits(['request-connection'])
const currentConnection = ref(null)

const handleRequestConnection = () => {
  // console.log('=== DatabaseHead: 用户点击连接数据库 ===')
  // console.log('=== DatabaseHead: 发送 request-connection 事件 ===')
  emit('request-connection')
  // console.log('=== DatabaseHead: 事件发送完成 ===')
}

const handleDisconnect = () => {
  // console.log('=== DatabaseHead: 用户点击断开连接 ===')
  
  if (currentConnection.value) {
    // 只更新当前连接的状态为未连接，不清空所有连接配置
    connStore.updateConnectionStatus(currentConnection.value.id, false)
    
    // 如果当前连接是当前活跃连接，清空本地响应式状态
    if (connStore.currentConnection && connStore.currentConnection.id === currentConnection.value.id) {
      connStore.currentConnection = null
    }
    
    ElMessage.success('已断开数据库连接')
  }
  
  // console.log('=== DatabaseHead: 触发 treeStore.refresh ===')
  treeStore.triggerRefresh()
  // console.log('=== DatabaseHead: 断开连接完成 ===')
}

const handleConnectionSuccess = (connectionConfig) => {
  // console.log('=== DatabaseHead: 收到 connection-success 事件 ===')
  // console.log('=== DatabaseHead: handleConnectionSuccess 开始 ===')
  // console.log('=== DatabaseHead: 连接配置:', connectionConfig)
  // console.log('=== DatabaseHead: currentConnection 将在此处更新 ===')
  
  currentConnection.value = connStore.currentConnection
  // console.log('=== DatabaseHead: 更新 currentConnection:', currentConnection.value)
  
  treeStore.triggerRefresh()
  // console.log('=== DatabaseHead: 触发 treeStore.refresh 完成 ===')
  
  // console.log('=== DatabaseHead: handleConnectionSuccess 结束 ===')
}


onMounted(() => {
  // 组件挂载时直接从connStore获取当前连接状态，不尝试重新连接
  currentConnection.value = connStore.currentConnection
})

// 监听connStore.currentConnection的变化，自动更新UI
watch(
  () => connStore.currentConnection,
  (newConnection) => {
    currentConnection.value = newConnection
  },
  { deep: true }
)

// 监听connStore.connections的变化，确保连接状态同步
watch(
  () => connStore.connections,
  () => {
    // 如果当前连接仍然存在于connections列表中，保留它
    // 否则，清空currentConnection
    if (currentConnection.value) {
      const connectionExists = connStore.connections.some(conn => conn.id === currentConnection.value.id)
      if (!connectionExists) {
        currentConnection.value = null
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.tree-header {
    padding-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.connection-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.connection-info {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #606266;
}

/* 圆点公共样式 */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.green  { background: #67c23a; }   
.yellow { background: #e6a23c; }   
</style>