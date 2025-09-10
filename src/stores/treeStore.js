// stores/treeStore.js
import { defineStore } from 'pinia'

export const useTreeStore = defineStore('tree', {
  state: () => ({
    refreshTrigger: 0, // 用于触发刷新
  }),
  actions: {
    triggerRefresh() {
      this.refreshTrigger += 1
    }
  }
})