import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MonitorConfig {
  slowQueryInterval: number
  cpuThreshold: number
  memoryThreshold: number
}

export const useMonitorStore = defineStore('monitor', () => {
  /* 监控配置 */
  const monitorConfig = ref<MonitorConfig>({
    slowQueryInterval: 5000,
    cpuThreshold: 80,
    memoryThreshold: 90
  })

  /* 获取监控配置 */
  const getMonitorConfig = () => {
    return monitorConfig.value
  }

  /* 保存监控配置 */
  const saveMonitorConfig = (config: MonitorConfig) => {
    monitorConfig.value = {
      ...monitorConfig.value,
      ...config
    }
  }

  return {
    monitorConfig,
    getMonitorConfig,
    saveMonitorConfig
  }
}, {
  persist: {
    key: 'monitor-config',
    storage: localStorage
  }
})