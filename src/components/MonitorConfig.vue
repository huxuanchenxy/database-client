<template>
  <el-button
    type="primary"
    @click="handleOpenDialog"
    size="small"
  >
    监控配置
  </el-button>

  <!-- 监控配置对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="监控配置"
    width="500px"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="monitorConfig"
      label-width="150px"
    >
      <el-form-item label="慢查询间隔时间(ms)">
        <el-input-number
          v-model="monitorConfig.slowQueryInterval"
          :step="1000"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="CPU阀值(%)">
        <el-input-number
          v-model="monitorConfig.cpuThreshold"
          :min="1"
          :max="100"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="内存阀值(%)">
        <el-input-number
          v-model="monitorConfig.memoryThreshold"
          :min="1"
          :max="100"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useMonitorStore } from '@/stores/monitor'

const monitorStore = useMonitorStore()
const dialogVisible = ref(false)
const formRef = ref(null)

// 监控配置数据
const monitorConfig = reactive({
  slowQueryInterval: 5000,
  cpuThreshold: 80,
  memoryThreshold: 90
})

// 打开监控配置对话框
const handleOpenDialog = () => {
  // 从store中加载当前配置
  const currentConfig = monitorStore.getMonitorConfig()
  monitorConfig.slowQueryInterval = currentConfig.slowQueryInterval
  monitorConfig.cpuThreshold = currentConfig.cpuThreshold
  monitorConfig.memoryThreshold = currentConfig.memoryThreshold
  
  dialogVisible.value = true
}

// 保存监控配置
const handleSave = () => {
  // 保存到store
  monitorStore.saveMonitorConfig(monitorConfig)
  
  ElMessage.success('监控配置保存成功')
  dialogVisible.value = false
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>