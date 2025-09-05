<template>
    <div class="sql-editor">
      <div class="editor-header">
        <div class="editor-toolbar">
          <el-button
            type="primary"
            @click="executeSql"
            :loading="executing"
            :icon="VideoPlay"  
          >
            执行
          </el-button>
          
          
          <!-- <el-button
            @click="clearSql"
            :icon="Delete"
          >
            清空
          </el-button> -->
          
        </div>
        
        <div class="editor-info">
          <span v-if="executing">执行中...</span>
          <span v-else-if="queryTime > 0">上次执行: {{ queryTime }}ms</span>
        </div>
      </div>

      <!-- <div class="sql-editor-wrapper">
        <VueMonacoEditor
          v-model:value="sqlCode"
          language="sql"
          theme="vs-dark"
          height="200px"
          class="editor"
        />
      </div> -->

    </div>

</template>

<script setup>
import { ref } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const sqlCode = ref('SELECT * FROM users;')
const isDarkTheme = ref(true)

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

const clearSql = () => {
  sqlCode.value = ''
}
</script>

<style>
.sql-editor-wrapper {
  display: flex;
  flex-direction: column;
}
.editor {
  border: 1px solid #ddd;
  border-radius: 4px;
}
.toolbar {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
