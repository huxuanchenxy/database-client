<template>

    <div class="tree-header">
      <el-button
        type="primary"
        @click="showConnectionDialog = true"
        :icon="Plus"
      >
        连接数据库
      </el-button>
      <!-- 第二行：连接状态（带圆点） -->
      <div class="connection-info">
        <el-tag :type="currentConnection?.dbHost ? 'info' : 'warning'">
          <span
            class="dot"
            :class="{
              green: currentConnection?.dbHost,
              yellow: !currentConnection?.dbHost,
            }"
          />
          {{
            currentConnection?.dbHost
              ? `已连接: ${currentConnection.dbHost}`
              : "未连接"
          }}
        </el-tag>
        <!-- 断开按钮 -->
        <el-button
          v-if="currentConnection?.dbHost"
          type="danger"
          plain
          @click="handleDisconnect"
          style="
            margin-left: 12px;
            height: 22px;
            padding: 0 6px;
            font-size: 12px;
          "
        >
          断开连接
        </el-button>
      </div>

      <!-- 连接配置对话框 -->
      <ConnectionConfig
        v-model="showConnectionDialog"
        @connection-success="handleConnectionSuccess"
      />
    </div>

</template>

<script setup>
import { ref, onMounted,watch,reactive  } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import ConnectionConfig from '@/components/ConnectionConfig.vue'
import { useConnStore } from '@/stores/conn'
import { useTreeStore } from '@/stores/treeStore'
const treeStore = useTreeStore()
const connStore = useConnStore()
const showConnectionDialog = ref(false)
const currentConnection = ref(null)

const handleDisconnect = () => {
  connStore.clearConn()          // 1. 清空持久化数据
  currentConnection.value = null // 2. 清空本地响应式状态
//   treeData.value = []            // 3. 清空左侧树
  treeStore.triggerRefresh()
  ElMessage.success('已断开数据库连接')
}

const handleConnectionSuccess = (connectionConfig) => {
  console.log('handleConnectionSuccess conn:',connectionConfig)
  currentConnection.value = connStore.conn
  treeStore.triggerRefresh()
//   loadDatabases()
}


onMounted(() => {
  currentConnection.value = connStore.conn
})
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