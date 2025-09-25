import { defineStore } from 'pinia'

export const useTabStore = defineStore('tab', {
  state: () => ({
    activeTab: 'sql'   // 默认页签
  }),
  persist: true        // 关键：刷新后自动恢复
})