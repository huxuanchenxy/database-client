import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Conn {
  dbName: string
  dbHost: string
  user: string
  password: string
}

export const useConnStore = defineStore('conn', () => {
  /* 想持久化的数据 */
  const conn = ref<Conn>({
    dbName: 'seis',
    dbHost: '10.89.34.9:5432',
    user: 'seis',
    password: 'seis'
  })

  function updateConn(partial: Partial<Conn>) {
    Object.assign(conn.value, partial)
  }

  function reset() {
    conn.value = {
      dbName: 'seis',
      dbHost: '10.89.34.9:5432',
      user: 'seis',
      password: 'seis'
    }
  }

  return { conn, updateConn, reset }
}, {
  persist: {
    key: 'conn',          // localStorage 键名
    storage: localStorage // 默认就是它，可省略
  }
})