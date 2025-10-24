<template>
    <div class="sql-editor">
      <div class="editor-header">
        <div class="editor-toolbar">
          <el-button
            type="primary"
            size="mini"
            @click="executeSql"
            :loading="executing"
            class="execute-button"
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
          theme="vs"
          language="sql"
          height="27vh"
          class="editor"
          :options="{ minimap: { enabled: false } }"
        />
      </div>

    </div>

</template>

<script setup>
import { ref,onMounted  } from 'vue'
import { VueMonacoEditor,useMonaco  } from '@guolao/vue-monaco-editor'
import { useSqlStore } from '@/stores/sqlStore'
import { databaseApi } from '@/api/api.js'
import { useConnStore } from '@/stores/conn'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'

const connStore = useConnStore()
const monaco = useMonaco() 
const sqlCode = ref('')
const isDarkTheme = ref(true)
const sqlStore = useSqlStore()
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

const clearSql = () => {
  sqlCode.value = ''
}

const executeSql = async() => {
  const sqlText = sqlCode.value   // 保持原始字符串
  if(!sqlText){
    ElMessage.error('sql不能为空')
    return
  }
  // 模拟 SQL 执行结果
  const result = {
  }
  // await executeSqlWithText(sqlText)
  sqlStore.setResult(sqlText, result)
}

const currentConnection = ref(null)
// const executeSqlWithText = async (sqlText) => {
//   currentConnection.value = connStore.conn
//   // console.log('currentConnection',currentConnection.value)
//   let parm = {
//         ...currentConnection.value,
//         oprationString: sqlText,
//   }
//   // console.log('parm', parm)
//   const res = await databaseApi.executeSqlWithText(parm)
//   console.log('res',res)
//   if(res.code === 200){
//     ElMessage.success('执行成功')
//   }else{
//     ElMessage.error('执行失败 失败原因:' + res.message)
//   }

// }

// onMounted(() => {
//   const m = monaco.value || window.monaco
//   if (!m) return
//   m.editor.defineTheme('custom-sql-theme', {
//     base: 'vs', // 'vs-dark' 或 'hc-black'
//     inherit: true,
//     rules: [],
//     colors: {
//       'editor.background': '#042464',       // 编辑器背景（最重要）
//       'editorWidget.background': '#042464',
//       'editorGutter.background': '#042464'
//     }
//   })
// })
</script>

<style>
.sql-editor-wrapper {
  display: flex;
  flex-direction: column;
  padding: 0% 2%;
}

.toolbar {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
.execute-button{
    left: 2%;
    position: relative;
    margin-bottom: 10px;
}

/* .editor {
  border: 1px solid #ddd;
  border-radius: 4px;
} */
.editor {
  border: 2px solid #a0c4ff;
  border-radius: 6px;
}

.monaco-editor,
.monaco-editor .overflow-guard,
.monaco-editor .monaco-editor-background,
.monaco-editor .view-lines,
.monaco-editor .margin,
.monaco-editor .lines-content {
  background-color: #DCE7FF !important;
}

/* 有时需要覆盖编辑器外层容器（wrapper） */
.vs .monaco-editor,
.vs-dark .monaco-editor {
  background-color: #DCE7FF !important;
}

</style>
