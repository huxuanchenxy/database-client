import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSqlStore = defineStore('sql', () => {
  const data = ref({ sql: '', result: null,type:'' })

  function setResult(sql, result,type) {
    // 每次执行都生成新对象，确保 watch 触发
    data.value = {
      sql,
      result,
      type,
      timestamp: Date.now() // 保证唯一性
    }
  }

  return { data, setResult }
})
