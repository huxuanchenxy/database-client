<template>
  <div class="result-area">
    <div class="result-header">
      <div class="result-tabs">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="结果" name="results">
            <template #label>
              <span>
                结果
              </span>
            </template>
          </el-tab-pane>

          <!-- <el-tab-pane label="消息" name="messages">
            <template #label>
              <span>
                消息
              </span>
            </template>
          </el-tab-pane> -->
        </el-tabs>
      </div>
    </div>

    <div class="result-content">
      <!-- 结果面板 -->
      <div v-show="activeTab === 'results'" class="results-tab">
        <div v-if="executing" class="executing">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>执行中...</span>
        </div>

        <div
          
          class="table-results"
        >
        <!-- 工具栏 -->
        <div class="grid-toolbar">
          <el-button v-if="resultSet.columns.length > 0"
            type="primary"
            size="mini"
            icon="el-icon-plus"
            :disabled="addLocked"
            @click="handleAdd"
          >新增一行</el-button>

          <!-- 新增-确认 -->
          <el-button
            v-if="addLocked"
            type="success"
            size="mini"
            icon="el-icon-check"
            @click="handleConfirmInsert"
          >确认新增</el-button>

          <!-- 编辑-确认 -->
          <el-button
            v-if="changedRowKeys.size"
            type="warning"
            size="mini"
            icon="el-icon-check"
            @click="handleConfirmUpdate"
          >提交修改</el-button>
        </div>
          <!-- ✅ vxe-grid 自适应高度 -->
          <div class="grid-wrapper">
                <vxe-grid
                  
                  ref="xGrid"
                  :data="resultSet.rows"
                  :columns="gridColumns"          
                  :edit-config="{ trigger: 'click', mode: 'row', showStatus: true }"
                  border
                  stripe
                  height="99%"
                  size="mini"
                  highlight-hover-row
                  auto-resize>
                </vxe-grid>

          </div>
        </div>
      </div>

      <!-- 消息面板 -->
      <div v-show="activeTab === 'messages'" class="messages-tab">
          <div class="result-info">
            <el-tag size="small" type="info">
              影响行数: {{ resultSet.affectedRows }}
            </el-tag>
            <el-tag size="small" type="success">
              查询时间: {{ resultSet.executionTime }}ms
            </el-tag>
            <el-tag size="small" type="warning">
              返回行数: {{ resultSet.rows.length }}
            </el-tag>
          </div>
        <!-- <el-scrollbar height="100%">
          <div v-if="messages.length === 0" class="no-messages">
            <el-empty description="暂无消息" />
          </div>
          <div v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message-item"
              :class="`message-${message.type}`"
            >
              <el-tag :type="getMessageTagType(message.type)" size="small">
                {{ getMessageTypeLabel(message.type) }}
              </el-tag>
              <div class="message-content">
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>
        </el-scrollbar> -->
      </div>

      <!-- 历史面板 -->
      <div v-show="activeTab === 'history'" class="history-tab">
        <HistoryPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick,onMounted,watch  } from 'vue'
import { VXETable } from 'vxe-table'
import { databaseApi } from '@/api/api.js'
import { Loading } from '@element-plus/icons-vue'
import HistoryPanel from './HistoryPanel.vue'
import { useConnStore } from '@/stores/conn'
import { useSqlStore } from '@/stores/sqlStore'
import { useTreeStore } from '@/stores/treeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parse } from 'sql-parser-cst'

const sqlStore = useSqlStore()
const connStore = useConnStore()
const treeStore = useTreeStore()
const localData = ref({ sql: '', result: null })
const emit = defineEmits(['calltree'])


onMounted(() => {
  // loadResult({ sql: 'select * from user' })
})
/* ==========  2. 响应式结果集  ========== */
const resultSet = reactive({
  columns: [],          // 动态列元数据
  rows: [],             // 真正数据
  executionTime: 0,
  affectedRows: 0
})

/* ==========  3. 把后端字段转成 vxe-columns  ========== */
const gridColumns = computed(() =>
  resultSet.columns.map(col => ({
    field: col,
    title: col,
    minWidth: 100,
    editRender: { name: 'input' }   // 如果想整表可编辑就留着
  }))
)


/* ==========  4. 加载数据  ========== */
// 父组件可以调用 loadResult({ sql: 'select * from user' })
const loadResult = async (sqlText) => {
  executing.value = true
  try {
    // const res = await databaseApi.getdata(parm)   // ← 接口
    // 假定后端返回格式：
  // console.log('currentConnection',currentConnection.value)
    const cleanedSql = sqlText.sql.replace(/\r\n/g, ' ');
    if(cleanedSql)
    {
        let parm = {
                  ...connStore.conn,
                  oprationString: cleanedSql,
        }
        const res = await databaseApi.executeSqlWithText(parm)
        // console.log('resultarea  databaseApi.executeSqlWithText',res)
        if(res.code === 200){
          // ElMessage.success('执行成功')
          // let res = { columns:['id','name','age'], data:[{id:1,name:'a'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:3,name:'cc'},{id:3,name:'cc'},{id:3,name:'cc'},{id:4,name:'dd'}], executionTime:88, affectedRows:2 }
          
          // ['employee_id', 'name', 'email', 'hire_date', 'department_id']
          try{//有可能是insert语句这里没有data返回
            resultSet.columns = res.data.columns || []
            const emptyRow = Object.fromEntries(res.data.columns.map(k => [k, '']))
            resultSet.rows = res.data.data && res.data.data.length > 0 ? res.data.data : []
            resultSet.affectedRows  =  0
          }catch(e){
            console.log('执行失败 错误信息:' + e.message)
          }
          //通知树更新
          treeStore.triggerRefresh()
          // console.log('treeStore.triggerRefresh()执行完毕')
        }else{
          ElMessage.error('执行失败 失败原因:' + res.message)
        }                                   
    }
    
    
    // await nextTick()
    // VXETable.modal.message({ content: '查询完成', status: 'success' })
  } catch (e) {
    // VXETable.modal.message({ content: e.message || '查询失败', status: 'error' })
  } finally {
    executing.value = false
  }
}

/* ==========  5. 暴露给父组件  ========== */
defineExpose({ loadResult })
// mock 消息
const messages = ref([
  { type: 'success', content: '执行成功', timestamp: Date.now() },
  { type: 'info', content: '查询完成', timestamp: Date.now() }
])

// mock 历史
const history = ref([
  { sql: 'SELECT * FROM users;', time: Date.now() },
  { sql: 'DELETE FROM users WHERE id=1;', time: Date.now() }
])

const executing = ref(false)
const activeTab = ref('results')


watch(
  () => sqlStore.data,
  (newVal) => {
    // console.log('ResultArea watch new data:', newVal)
    localData.value = newVal
    loadResult(newVal)
  },
  { immediate: true }
)

// console.log('activeTab', activeTab.value)

// 统计数据
const messageCount = computed(() => messages.value.filter(m => m.type !== 'success').length)
const historyCount = computed(() => history.value.length)

// 工具方法
const getMessageTagType = (type) => {
  const types = { error: 'danger', warning: 'warning', success: 'success', info: 'info' }
  return types[type] || 'info'
}
const getMessageTypeLabel = (type) => {
  const labels = { error: '错误', warning: '警告', success: '成功', info: '信息' }
  return labels[type] || '信息'
}
const formatTime = (timestamp) => new Date(timestamp).toLocaleString()

const xGrid = ref()
/* ===== 新增/编辑 状态 ===== */
const addLocked = ref(false)          // 是否正在新增
const changedRowKeys = ref(new Set()) // 被修改过的行主键集合

/* ===== 主键字段名（让后端返回，或你自己配置） ===== */
const pkField = computed(() => {
  /* 约定：后端把主键放在 columns 第一个，或者你自己写死 'id' */
  return resultSet.columns[0] || 'id'
})

/* ===== 工具函数：把一行转成 where 条件 ===== */
function rowToWhere(row) {
  return ` \`${pkField.value}\` = ${formatValue(row[pkField.value])} `
}

/* ===== 工具函数：值转 SQL 字面量 ===== */
function formatValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`
  return v
}

/* ========== 1. 点击“新增一行” ========== */
function handleAdd() {
  if (addLocked.value) return
  addLocked.value = true
  const empty = Object.fromEntries(resultSet.columns.map(k => [k, '']))
  resultSet.rows.unshift(empty)        // 插到最前面
  nextTick(() => {
    const grid = xGrid.value
    grid.setActiveRow(resultSet.rows[0]) // 自动进入编辑
  })

}

/* ========== 2. 确认新增 -> 拼 INSERT -> 调接口 ========== */
async function handleConfirmInsert() {
  const row = resultSet.rows[0]
  const fields = []
  const values = []
  resultSet.columns.forEach(col => {
    fields.push(`\`${col}\``)
    values.push(formatValue(row[col]))
  })
  let cursql = sqlStore.data.sql
  let tablename = cursql.match(/FROM\s+([^\s;]+)/i)?.[1] ?? ''
  const sql = `INSERT INTO ` + tablename + ` (${fields.join(',')}) VALUES (${values.join(',')})`
  try {
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    if (res.code === 200) {
      ElMessage.success('新增成功')
      addLocked.value = false
      await reloadQuery() // 重新查一遍
    } else {
      ElMessage.error('新增失败：' + res.message)
    }
  } catch (e) {
    ElMessage.error('新增异常：' + e.message)
  }
}

/* ========== 3. 行编辑完成时记录被改动的主键 ========== */
function handleEditClosed({ row }) {
  const key = row[pkField.value]
  if (key !== undefined && key !== '') {
    changedRowKeys.value.add(key)
  }
}

/* ========== 4. 提交修改 -> 拼 UPDATE -> 调接口 ========== */
async function handleConfirmUpdate() {
  const grid = xGrid.value
  const fullData = grid.getTableData().fullData
  const promises = []
  changedRowKeys.value.forEach(key => {
    const row = fullData.find(r => r[pkField.value] === key)
    if (!row) return
    const setList = []
    resultSet.columns.forEach(col => {
      setList.push(`\`${col}\` = ${formatValue(row[col])}`)
    })
    const sql = `UPDATE \`your_table\` SET ${setList.join(',')} WHERE ${rowToWhere(row)}`
    promises.push(
      databaseApi
        .executeSqlWithText({ ...connStore.conn, oprationString: sql })
        .then(res => {
          if (res.code !== 200) throw new Error(res.message)
        })
    )
  })
  try {
    await Promise.all(promises)
    ElMessage.success('修改已提交')
    changedRowKeys.value.clear()
    await reloadQuery() // 刷新
  } catch (e) {
    ElMessage.error('提交失败：' + e.message)
  }
}

/* ========== 5. 重新执行最开始的查询语句 ========== */
async function reloadQuery() {
  // 把最初查数据的 SQL 再执行一遍即可
  // 这里偷懒直接调用你原来的 loadResult，需要把 sqlText 存起来
  await loadResult(sqlStore.data.sql) // 自己在外层缓存一下
}
</script>

<style scoped>
.grid-wrapper {
  flex: 1;
  min-height: 420px;
  padding: 8px;
  overflow-y: auto;
}

</style>
