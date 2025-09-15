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
          
           <div class="btn-box">
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
                    <el-button
            v-if="addLocked"
            type="success"
            size="mini"
            icon="el-icon-check"
            @click="handleCancelInsert"
          >取消新增</el-button>

          <!-- 编辑-确认 -->
          <!-- <el-button
            v-if="changedRowKeys.size"
            type="warning"
            size="mini"
            icon="el-icon-check"
            @click="handleConfirmUpdate"
          >提交修改</el-button> -->
          </div>
          <span clss="table-name">{{tableName}}</span>
        </div>
          <!-- ✅ vxe-grid 自适应高度 -->
          <div class="grid-wrapper">
                <vxe-grid
                ref="xGrid"
                :data="resultSet.rows"
                :columns="gridColumns"
                :edit-config="{ trigger: 'manual', mode: 'row', showStatus: true }"
                border
                stripe
                height="99%"
                size="mini"
                highlight-hover-row
                auto-resize>

                  <template #action_slot="{ row }">
                  <!-- 未编辑状态 -->
                  <template v-if="!row.__editing && addLocked === false">
                    <!-- <el-button type="primary" size="mini" @click="startEdit(row)">
                      编辑
                    </el-button>
                    <el-button type="primary" size="mini" @click="startDelete(row)">
                      删除
                    </el-button> -->
                  </template>

                  <!-- 编辑中状态 -->
                  <template v-else>
                    <el-button v-if="addLocked === false"
                      type="success"
                      size="mini"
                      :loading="row.__saving"
                      @click="confirmEdit(row)">
                      确认
                    </el-button>
                    <el-button v-if="addLocked === false"
                      type="info"
                      size="mini"
                      @click="cancelEdit(row)">
                      取消
                    </el-button>
                  </template>
                </template>
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
import { add } from 'xe-utils'

const sqlStore = useSqlStore()
const connStore = useConnStore()
const treeStore = useTreeStore()
const localData = ref({ sql: '', result: null })
const emit = defineEmits(['calltree'])

const tableName = computed(() => {
  let cursql = sqlStore.data.sql
  let tablename = cursql.match(/FROM\s+([^\s;]+)/i)?.[1] ?? ''
  return tablename;
});
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
const gridColumns = computed(() => {
  const cols = resultSet.columns.map(col => ({
    field: col,
    title: col,
    minWidth: 100,
    editRender: { name: 'input' , immediate: true}
  }))

  // 操作列
  cols.push({
    field: 'action',
    title: '操作',
    width: 90,
    fixed: 'right',
    slots: { default: 'action_slot' }
  })

  return cols
})


/* ==========  4. 加载数据  ========== */
// 父组件可以调用 loadResult({ sql: 'select * from user' })
const loadResult = async (sqlText) => {
  executing.value = true
  try {
    // const res = await databaseApi.getdata(parm)   // ← 接口
    // 假定后端返回格式：
  // console.log('loadResult',sqlText)

    const cleanedSql = sqlText.sql ? sqlText.sql.replace(/\r\n/g, ' '): sqlText.replace(/\r\n/g, ' ');
    // console.log('cleanedSql',cleanedSql)
    if(cleanedSql)
    {
        let parm = {
                  ...connStore.conn,
                  oprationString: cleanedSql,
        }
        const res = await databaseApi.executeSqlWithText(parm)
        // console.log('resultarea  databaseApi.executeSqlWithText',res)
        if(res.code === 200){
          
          // let res = { columns:['id','name','age'], data:[{id:1,name:'a'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:2,name:'b'},{id:3,name:'cc'},{id:3,name:'cc'},{id:3,name:'cc'},{id:4,name:'dd'}], executionTime:88, affectedRows:2 }
          
          // ['employee_id', 'name', 'email', 'hire_date', 'department_id']
          try{//有可能是insert语句这里没有data返回
            // ElMessage.success(res.message)
            resultSet.columns = res.data.columns || []
            const emptyRow = Object.fromEntries(res.data.columns.map(k => [k, '']))
            resultSet.rows = res.data.data && res.data.data.length > 0 ? res.data.data : []
            resultSet.affectedRows  =  0

            // console.log('resultSet',resultSet)
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
  /* 约定TODO：后端把主键放在 columns 第一个，或者你自己写死 'id' */
  return resultSet.columns[0] || 'id'
})

/* ===== 工具函数：把一行转成 where 条件 ===== */
function rowToWhere(row) {
  return ` ${pkField.value} = ${formatValue(row[pkField.value])} `
}

function rowToWherev2(row) {
  return ` ${pkField.value} = ${curID.value} `
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
    // fields.push(`\`${col}\``)
    fields.push(col)
    values.push(formatValue(row[col]))
  })
  let cursql = sqlStore.data.sql
  let tablename = cursql.match(/FROM\s+([^\s;]+)/i)?.[1] ?? ''
  const sql = "INSERT INTO " + tablename + " ( " + fields.join(',') + " ) VALUES ( " + values.join(',') + ")"
  console.log('sql',sql)
  try {
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    // console.log('res222',res)
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

/* 取消编辑：不保存，直接退出 */
function cancelEdit(row) {
  xGrid.value.clearActived() // 退出编辑状态
  row.__editing = false      // 按钮恢复“编辑”
}

async function handleCancelInsert() {
  try {
      await reloadQuery() // 重新查一遍
      addLocked.value = false
  } catch (e) {
    ElMessage.error('加载异常：' + e.message)
  }
}

const curID = ref('')
function handleCellClick({ row, column }) {
  // const grid = xGrid.value
  // grid.setActiveRow(row, column.property)
  curID.value = formatValue(row[pkField.value]) //保存修改前的主键的值
  // console.log('curID',curID.value)
}
/* ========== 3. 行编辑完成时记录被改动的主键 ========== */
async function handleEditClosed({ row }) {
  if (addLocked.value) return //新增模式不进更新
  const key = row[pkField.value]
  if (!row) return
  const setList = []
  resultSet.columns.forEach(col => {
    setList.push(`${col} = ${formatValue(row[col])}`)
  })
  console.log('setList',setList)
  const sql = "UPDATE " + tableName.value + " SET " + setList.join(',') + " WHERE " + rowToWherev2(row) + ";"
  try {
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    // console.log('res222',res)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      addLocked.value = false
      await reloadQuery() 
    } else {
      ElMessage.error('更新失败：' + res.message)
    }
  } catch (e) {
    ElMessage.error('更新异常：' + e.message)
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

/* 进入编辑 */
function startEdit(row) {
  const grid = xGrid.value
  grid.setActiveRow(row)    
  curID.value = formatValue(row[pkField.value])       // 让该行进入编辑
  row.__editing = true            // 控制按钮显示
}


async function startDelete(row) {
  curID.value = formatValue(row[pkField.value]) 
    await ElMessageBox.confirm(
      '确定要删除这行数据吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    console.log('row',row)
    try {

    const sql = `DELETE FROM ${tableName.value}  WHERE ${rowToWherev2(row)}`

    /* 2. 调接口 */
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    if (res.code === 200) {
      ElMessage.success('已删除')
      xGrid.value.clearActived()   // 退出编辑
      row.__editing = false
      await reloadQuery()          // 可选：重新拉一遍最新数据
    } else {
      ElMessage.error('删除失败：' + res.message)
    }
  } catch (e) {
    ElMessage.error('删除异常：' + e.message)
  } finally {
    row.__saving = false
  }
}

/* 确认保存 */
async function confirmEdit(row) {
  row.__saving = true
  try {
    const setList = []
    resultSet.columns.forEach(col => {
      setList.push(`${col} = ${formatValue(row[col])}`) // 这里就是用户编辑后的值
    })
    console.log('setList',setList)
    const sql = `UPDATE ${tableName.value} SET ${setList.join(',')} WHERE ${rowToWherev2(row)}`

    /* 2. 调接口 */
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    if (res.code === 200) {
      ElMessage.success('已更新')
      xGrid.value.clearActived()   // 退出编辑
      row.__editing = false
      await reloadQuery()          // 可选：重新拉一遍最新数据
    } else {
      ElMessage.error('更新失败：' + res.message)
    }
  } catch (e) {
    ElMessage.error('更新异常：' + e.message)
  } finally {
    row.__saving = false
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

.grid-toolbar {
  display: flex;
  align-items: center;   /* 垂直居中 */
}

/* 按钮组占满左侧剩余空间，把表名顶到最右 */
.btn-box {
  margin-right: auto;
}

/* 表名本身不需要额外样式就能贴在右边 */
.table-name {
  /* 可选：微调与按钮间距 */
  margin-left: auto;   /* 关键：顶到最右 */
  padding-right: 12px; /* 右边留空，不需要 position */
}
</style>
