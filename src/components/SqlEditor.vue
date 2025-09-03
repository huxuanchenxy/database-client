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
          执行 (Ctrl+Enter)
        </el-button>
        
        <el-button
          @click="executeSelected"
          :loading="executing"
          :disabled="selectedSql === ''"
          :icon="VideoPause"  
        >
          执行选中
        </el-button>
        
        <el-button
          @click="clearSql"
          :icon="Delete"
        >
          清空
        </el-button>
        
      </div>
      
      <div class="editor-info">
        <span v-if="executing">执行中...</span>
        <span v-else-if="queryTime > 0">上次执行: {{ queryTime }}ms</span>
      </div>
    </div>

    <div class="editor-container">
      <div
        ref="editorElement"
        class="sql-editor-content"
      ></div>
    </div>

    <div class="editor-footer">
      <el-input
        v-model="sqlComment"
        placeholder="输入SQL注释（可选）"
        size="small"
        style="margin-bottom: 10px; width: 100%"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { VideoPlay, VideoPause, Delete, Sunny } from '@element-plus/icons-vue'  // 使用正确的图标
import { useSqlEditor } from '../composables/useSqlEditor'
import { ElMessage } from 'element-plus';

const props = defineProps({
  connection: Object,
  onExecute: Function
})

const emit = defineEmits(['execute'])

const {
  sqlCode,
  editorView,
  initEditor,
  updateSqlCode,
  toggleTheme,
  clearSql,
  isDarkTheme
} = useSqlEditor()

const executing = ref(false)
const queryTime = ref(0)
const selectedSql = ref('')
const sqlComment = ref('')
const editorElement = ref()

// 获取选中的SQL
const getSelectedSql = () => {
  if (!editorView.value) return ''
  
  const selection = editorView.value.state.selection
  if (selection.ranges.length > 0) {
    const range = selection.ranges[0]
    if (range.from !== range.to) {
      return editorView.value.state.doc.sliceString(range.from, range.to)
    }
  }
  return ''
}

// 执行选中的SQL
const executeSelected = async () => {
  selectedSql.value = getSelectedSql()
  if (selectedSql.value.trim() === '') {
    ElMessage.warning('请先选择要执行的SQL语句')
    return
  }
  
  await executeSqlInternal(selectedSql.value)
}

// 执行SQL
const executeSql = async () => {
  selectedSql.value = ''
  await executeSqlInternal(sqlCode.value)
}

// 内部执行SQL方法
const executeSqlInternal = async (sqlToExecute) => {
  if (!props.connection) {
    ElMessage.warning('请先连接数据库')
    return
  }
  
  if (!sqlToExecute || sqlToExecute.trim() === '') {
    ElMessage.warning('请输入SQL语句')
    return
  }
  
  try {
    executing.value = true
    const startTime = Date.now()
    
    const result = await props.onExecute({
      ...props.connection,
      sql: sqlToExecute.trim()
    })
    
    queryTime.value = Date.now() - startTime
    
    if (result && emit) {
      emit('execute', {
        sql: sqlToExecute,
        result: result,
        time: queryTime.value,
        comment: sqlComment.value
      })
    }
    
    ElMessage.success(`执行完成，耗时 ${queryTime.value}ms`)
  } catch (error) {
    console.error('执行SQL失败:', error)
    ElMessage.error('执行失败: ' + (error.message || '未知错误'))
  } finally {
    executing.value = false
  }
}

// 清空SQL
const handleClearSql = () => {
  clearSql()
  sqlComment.value = ''
}

// 切换主题
const handleToggleTheme = () => {
  toggleTheme()
}

// 键盘快捷键
const handleKeydown = (event) => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault()
    executeSql()
  }
}

onMounted(async () => {
  await nextTick()
  if (editorElement.value) {
    initEditor(editorElement.value)
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sql-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.editor-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.editor-info {
  font-size: 12px;
  color: #666;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.sql-editor-content {
  height: 100%;
  width: 100%;
}

.editor-footer {
  padding: 8px 10px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
}

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-focused) {
  outline: none;
}
</style>