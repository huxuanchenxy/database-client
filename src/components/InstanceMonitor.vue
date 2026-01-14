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
    width="1100px"
    append-to-body
  >
    <div class="instance-monitor-dialog">
      <div class="dialog-header">
        <el-button
          type="primary"
          size="small"
          @click="handleRefresh"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
      <el-table :data="monitorList" style="width: 100%" stripe>
        <el-table-column prop="connectionName" label="连接名称" min-width="90">
          <template #default="scope">
            <span class="connection-name">{{ scope.row.connectionName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dbHost" label="主机地址" min-width="120">
          <template #default="scope">
            <span>{{ scope.row.dbHost }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dbName" label="数据库名" width="100">
          <template #default="scope">
            <span>{{ scope.row.dbName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isConnected" label="连接状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isConnected ? 'success' : 'danger'">
              {{ scope.row.isConnected ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU使用率" width="130">
          <template #default="scope">
            <div class="monitor-item">
              <div v-if="!scope.row.loading" class="monitor-content">
                <span class="monitor-text">{{ Number(scope.row.cpu) }}%</span>
                <el-progress
                  :percentage="Number(scope.row.cpu)"
                  :status="scope.row.cpuStatus === 1 ? 'exception' : 'success'"
                  :stroke-width="8"
                  :show-text="false"
                ></el-progress>
              </div>
              <el-skeleton v-else animated :rows="1" :width="'100%'" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="内存使用率" width="150">
          <template #default="scope">
            <div class="monitor-item">
              <div v-if="!scope.row.loading" class="monitor-content">
                <span class="monitor-text">{{ Number(scope.row.memory) }}%</span>
                <el-progress
                  :percentage="Number(scope.row.memory)"
                  :status="scope.row.memoryStatus === 1 ? 'exception' : 'success'"
                  :stroke-width="8"
                  :show-text="false"
                ></el-progress>
              </div>
              <el-skeleton v-else animated :rows="1" :width="'100%'" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button
                type="primary"
                size="small"
                @click="handleOperate(scope.row, 1)"
                :loading="operationLoading[scope.row.id]"
              >
                启动
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleOperate(scope.row, 2)"
                :loading="operationLoading[scope.row.id]"
              >
                停止
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleOperate(scope.row, 3)"
                :loading="operationLoading[scope.row.id]"
              >
                重启
              </el-button>
            </div>
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConnStore } from '@/stores/conn'
import { useMonitorStore } from '@/stores/monitor'
import { databaseApi } from '@/api/api'

const connStore = useConnStore()
const monitorStore = useMonitorStore()
const dialogVisible = ref(false)
const loading = ref(false)

// 操作加载状态
const operationLoading = ref({})

// 监控列表数据
const monitorList = ref([])

// 打开实例监控对话框
const handleOpenDialog = () => {
  dialogVisible.value = true
  // 加载监控数据
  loadMonitorData()
}

// 监听对话框显示状态，当显示时加载数据
watch(dialogVisible, (newVal) => {
  if (newVal) {
    loadMonitorData()
  }
})

// 加载监控数据
const loadMonitorData = async () => {
  loading.value = true
  
  // 获取连接列表
  const connections = connStore.connections
  // 获取监控配置
  const monitorConfig = monitorStore.getMonitorConfig()
  
  // 构建操作字符串：cpuThreshold,memoryThreshold
  const oprationString = `${monitorConfig.cpuThreshold},${monitorConfig.memoryThreshold}`
  
  // 遍历每个连接，获取监控数据
  const monitorDataList = await Promise.all(connections.map(async (connection) => {
    try {
      // 调用getmonitor接口
      const params = {
        dbName: connection.dbName,
        dbHost: connection.dbHost,
        user: connection.user,
        password: connection.password,
        isssl: connection.isssl || 0,
        oprationString: oprationString
      }
      
      const response = await databaseApi.getmonitor(params)
      
      if (response.code === 200) {
        return {
          ...connection,
          ...response.data,
          loading: false
        }
      } else {
        return {
          ...connection,
          cpu: '-',
          cpuStatus: 0,
          memory: '-',
          memoryStatus: 0,
          loading: false
        }
      }
    } catch (error) {
      console.error(`获取连接 ${connection.connectionName} 的监控数据失败:`, error)
      return {
        ...connection,
        cpu: '-',
        cpuStatus: 0,
        memory: '-',
        memoryStatus: 0,
        loading: false
      }
    }
  }))
  
  // 更新监控列表
  monitorList.value = monitorDataList
  loading.value = false
}

// 实例操作（启动/停止/重启）
const handleOperate = async (connection, oprationInt) => {
  try {
    // 设置对应连接实例的loading状态
    operationLoading.value[connection.id] = true
    
    // 构建请求参数
    const params = {
      dbName: connection.dbName,
      dbHost: connection.dbHost,
      user: connection.user,
      password: connection.password,
      oprationInt: oprationInt,
      isssl: connection.isssl || 0
    }
    
    // 调用operdbservice接口
    const response = await databaseApi.operdbservice(params)
    
    // 处理返回结果
    if (response.code === 200 && response.data.status === 1) {
      // 操作成功
      const operationText = oprationInt === 1 ? '启动' : oprationInt === 2 ? '停止' : '重启'
      ElMessage.success(`${operationText}实例成功`)
      
      // 刷新监控数据
      loadMonitorData()
    } else {
      // 操作失败
      const operationText = oprationInt === 1 ? '启动' : oprationInt === 2 ? '停止' : '重启'
      ElMessage.error(`${operationText}实例失败: ${response.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('操作实例失败:', error)
    const operationText = oprationInt === 1 ? '启动' : oprationInt === 2 ? '停止' : '重启'
    ElMessage.error(`${operationText}实例失败: ${error.message || '网络错误'}`)
  } finally {
    // 重置loading状态
    operationLoading.value[connection.id] = false
  }
}

// 刷新连接列表
const handleRefresh = () => {
  loadMonitorData()
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

.monitor-item {
  padding: 4px 0;
}

.monitor-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.monitor-text {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

:deep(.el-progress) {
  flex: 1;
  margin: 0;
}

.operation-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.operation-buttons :deep(.el-button) {
  padding: 0 10px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}
</style>