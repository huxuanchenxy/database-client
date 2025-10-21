import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Conn {
  dbName: string
  dbHost: string
  user: string
  password: string
}

export const useConnStore = defineStore('conn', () => {
  /* 初始值：带默认字段的对象 */
  const conn = ref<Conn>({
    dbName: 'seis',
    dbHost: '10.89.34.9:5432',
    user: 'seis',
    password: 'seis'
  })

  /* 增量更新 */
  function updateConn(partial: Partial<Conn>) {
    // 兜底：如果意外被清空成 null/undefined，先重置为空对象
    if (!conn.value) conn.value = {} as Conn
    Object.assign(conn.value, partial)
  }

  /* 恢复默认连接 */
  function reset() {
    conn.value = {
      dbName: 'seis',
      dbHost: '10.89.34.9:5432',
      user: 'seis',
      password: 'seis'
    }
  }

  /* 新增：清空连接（置为空对象，而非 null） */
  function clearConn() {
    conn.value = {
      dbName: '',
      dbHost: '',
      user: '',
      password: ''
    } as Conn
  }

  return { conn, updateConn, reset, clearConn }
}, {
  persist: {
    key: 'conn',
    storage: localStorage
  }
})