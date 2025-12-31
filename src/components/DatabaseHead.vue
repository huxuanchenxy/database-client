<template>

    <div class="tree-header">
      <el-button
        type="primary"
        @click="handleRequestConnection"
        :icon="Plus"
      >
        连接数据库实例
      </el-button>
      
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
  console.log('=== DatabaseHead: 用户点击连接数据库 ===')
  console.log('=== DatabaseHead: 发送 request-connection 事件 ===')
  emit('request-connection')
  console.log('=== DatabaseHead: 事件发送完成 ===')
}

const handleDisconnect = () => {
  console.log('=== DatabaseHead: 用户点击断开连接 ===')
  
  connStore.clearConn()          // 1. 清空持久化数据
  currentConnection.value = null // 2. 清空本地响应式状态
  
  console.log('=== DatabaseHead: 触发 treeStore.refresh ===')
  treeStore.triggerRefresh()
  
  ElMessage.success('已断开数据库连接')
  console.log('=== DatabaseHead: 断开连接完成 ===')
}

const handleConnectionSuccess = (connectionConfig) => {
  console.log('=== DatabaseHead: 收到 connection-success 事件 ===')
  console.log('=== DatabaseHead: handleConnectionSuccess 开始 ===')
  console.log('=== DatabaseHead: 连接配置:', connectionConfig)
  console.log('=== DatabaseHead: currentConnection 将在此处更新 ===')
  
  currentConnection.value = connStore.currentConnection
  console.log('=== DatabaseHead: 更新 currentConnection:', currentConnection.value)
  
  treeStore.triggerRefresh()
  console.log('=== DatabaseHead: 触发 treeStore.refresh 完成 ===')
  
  console.log('=== DatabaseHead: handleConnectionSuccess 结束 ===')
}


onMounted( async() => {
  await load()
})

async function load() {
  // console.log('onMounted conn:',connStore.conn)
  try {
    const result = await databaseApi.testConnection(connStore.currentConnection)
    if (result.code === 200) {
      currentConnection.value = connStore.currentConnection
    } else {
      currentConnection.value = null
    }
  } catch (error) {
    currentConnection.value = null
  }
}
</script>

<style scoped>
.tree-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    padding-top: 10px;
} 
.connection-info {
line-height: 1;
margin-top: 8px;
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