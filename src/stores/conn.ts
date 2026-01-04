import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Conn {
  dbName: string
  dbHost: string
  user: string
  password: string
  issl?: number
}

export interface ConnectionInstance extends Conn {
  id: number
  connectionName: string
}

export const useConnStore = defineStore('conn', () => {
  /* 存储所有连接实例 */
  const connections = ref<ConnectionInstance[]>([])
  
  /* 当前活跃连接 */
  const currentConnection = ref<ConnectionInstance | null>(null)

  /* 添加新连接实例 */
  function addConnection(connection: ConnectionInstance) {
    // 检查是否已存在相同ID的连接
    const existingIndex = connections.value.findIndex(conn => conn.id === connection.id)
    if (existingIndex !== -1) {
      // 更新现有连接
      connections.value[existingIndex] = connection
    } else {
      // 添加新连接
      connections.value.push(connection)
    }
    
    // 设置为当前连接
    currentConnection.value = connection
  }

  /* 移除连接实例 */
  function removeConnection(id: number) {
    const index = connections.value.findIndex(conn => conn.id === id)
    if (index !== -1) {
      // 移除连接
      connections.value.splice(index, 1)
      
      // 如果移除的是当前连接，更新当前连接
      if (currentConnection.value && currentConnection.value.id === id) {
        currentConnection.value = connections.value.length > 0 ? connections.value[0] : null
      }
    }
  }

  /* 清空所有连接实例 */
  function clearAllConnections() {
    connections.value = []
    currentConnection.value = null
  }

  /* 增量更新当前连接 */
  function updateConn(partial: Partial<Conn>) {
    if (currentConnection.value) {
      Object.assign(currentConnection.value, partial)
      
      // 同时更新connections数组中的对应连接
      const index = connections.value.findIndex(conn => conn.id === currentConnection.value!.id)
      if (index !== -1) {
        connections.value[index] = { ...currentConnection.value }
      }
    }
    // 如果没有当前连接，不自动创建，由外部handleConnectionSuccess统一处理
  }

  /* 恢复默认连接 */
  function reset() {
    const defaultConnection: ConnectionInstance = {
      dbName: 'seis',
      dbHost: '10.89.34.9:5432',
      user: 'seis',
      password: 'seis',
      id: Date.now(),
      connectionName: '默认连接'
    }
    connections.value = [defaultConnection]
    currentConnection.value = defaultConnection
  }

  /* 新增：清空连接（置为空数组） */
  function clearConn() {
    clearAllConnections()
  }

  return { 
    connections, 
    currentConnection,
    addConnection, 
    removeConnection, 
    clearAllConnections,
    updateConn, 
    reset, 
    clearConn 
  }
}, {
  persist: {
    key: 'connections', // 更改key，避免与旧数据冲突
    storage: localStorage
  }
})