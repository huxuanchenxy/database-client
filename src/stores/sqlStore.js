import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSqlStore = defineStore('sql', () => {
  const data = ref({ sql: '', result: null })

  function setResult(sql, result) {
    // 每次执行都生成新对象，确保 watch 触发
    data.value = {
      sql,
      result,
      timestamp: Date.now() // 保证唯一性
    }
  }

  return { data, setResult }
})
