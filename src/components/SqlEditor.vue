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

      <div class="sql-editor-wrapper">
        <VueMonacoEditor
          v-model:value="sqlCode"
          language="sql"
          theme="vs"
          height="30vh"
          class="editor"
          :options="{ minimap: { enabled: false } }"
        />
      </div>

    </div>

</template>

<script setup>
import { ref } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useSqlStore } from '@/stores/sqlStore'
import { databaseApi } from '@/api/api.js'
import { useConnStore } from '@/stores/conn'

const connStore = useConnStore()

const sqlCode = ref('SELECT * FROM users;')
const isDarkTheme = ref(true)
const sqlStore = useSqlStore()
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

const clearSql = () => {
  sqlCode.value = ''
}

function executeSql() {
  const sqlText = sqlCode.value   // 保持原始字符串

  // 模拟 SQL 执行结果
  const result = {
    columns: ['id', 'name'],
    rows: [
      [1, 'Alice'],
      [2, 'Bob']
    ]
  }
  sqlStore.setResult(sqlText, result)
  executeSqlWithText(sqlText)
}

const currentConnection = ref(null)
const executeSqlWithText = async (sqlText) => {
  currentConnection.value = connStore.conn
  // console.log('currentConnection',currentConnection.value)
  let parm = {
        ...currentConnection.value,
        oprationString: sqlText,
  }
  // console.log('parm', parm)
  const res = await databaseApi.executeSqlWithText(parm)
  // console.log('res',res)
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
