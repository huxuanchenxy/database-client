<template>
  <el-button
    type="primary"
    @click="handleOpenDialog"
    size="small"
  >
    实例监控
  </el-button>

  <!-- 实例监控对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="实例监控"
    width="800px"
    append-to-body
  >
    <div class="instance-monitor-dialog">
      <div class="dialog-header">
        <el-button
          type="primary"
          size="small"
          @click="handleRefresh"
        >
          刷新
        </el-button>
      </div>
      <el-table :data="connectionList" style="width: 100%">
        <el-table-column prop="connectionName" label="连接名称" min-width="180">
          <template #default="scope">
            <span class="connection-name">{{ scope.row.connectionName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dbHost" label="主机地址" min-width="180">
          <template #default="scope">
            <span>{{ scope.row.dbHost }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isConnected" label="连接状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.isConnected ? 'success' : 'danger'">
              {{ scope.row.isConnected ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useConnStore } from '@/stores/conn'

const connStore = useConnStore()
const dialogVisible = ref(false)

// 计算属性，从connStore获取连接列表
const connectionList = computed(() => {
  return connStore.connections
})

// 打开实例监控对话框
const handleOpenDialog = () => {
  dialogVisible.value = true
}

// 刷新连接列表
const handleRefresh = () => {
  // 连接列表会通过computed自动从connStore获取最新数据
  // 这里可以添加额外的刷新逻辑，比如重新连接或获取更多信息
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.instance-monitor-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-header {
  display: flex;
  justify-content: flex-end;
}

.connection-name {
  font-weight: 500;
}
</style>