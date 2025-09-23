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
        <div class="grid-toolbar" v-if="fieldMeta">
          
           <div class="btn-box" >
          <el-button v-if="resultSet.columns.length > 0"
            type="primary"
            size="mini"
            :disabled="addLocked"
            @click="handleAdd"
          >新增一行</el-button>

          <!-- 新增-确认 -->
          <el-button
            v-if="addLocked"
            type="success"
            size="mini"
            @click="handleConfirmInsert"
          >确认新增</el-button>
                    <el-button
            v-if="addLocked"
            type="success"
            size="mini"
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
                v-if="fieldMeta"
                ref="xGrid"
                :data="resultSet.rows"
                :columns="gridColumns"
                keep-source
                :edit-config="{ trigger: 'manual', mode: 'row', showStatus: true,showAsterisk: true }"
                :loading="loading"
                border
                stripe
                height="99%"
                size="mini"
                highlight-hover-row
                auto-resize
                :pager-config="tablePage"
                @page-change="handlePageChange"
                >

                  <template #action_slot="{ row }">
                  <!-- 未编辑状态 -->
                  <template v-if="!row.__editing && addLocked === false">
                    <el-button type="primary" size="mini" @click="startEdit(row)">
                      编辑
                    </el-button>
                    <el-button type="primary" size="mini" @click="startDelete(row)">
                      删除
                    </el-button>
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
import { databaseApi } from '@/api/api.js'
import { Loading } from '@element-plus/icons-vue'
import HistoryPanel from './HistoryPanel.vue'
import { useConnStore } from '@/stores/conn'
import { useSqlStore } from '@/stores/sqlStore'
import { useTreeStore } from '@/stores/treeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pickTablesByAst,isSelectStatement,hasLimitClause } from '@/utils/sqlTableAst'
import { quoteId } from '@/utils/db.js'
const sqlStore = useSqlStore()
const connStore = useConnStore()
const treeStore = useTreeStore()
const localData = ref({ sql: '', result: null })
const emit = defineEmits(['calltree'])

const fieldMeta = ref({}) // 保存每个字段的类型  { colName: 'date' | 'time' | 'datetime' | 'string' ... }

/* 把字段类型翻译成 vxe 的 editRender 配置 */
function mapTypeToEditRender(type) {
  // 统一转小写
  // console.log('type', type)
  const t = (type || '').toLowerCase()

  if (t === 'date')
    return {
      name: 'ElDatePicker',
      props: { type: 'date', format: 'YYYY-MM-DD', valueFormat: 'YYYY-MM-DD' },
      immediate: true
    }

  if (t === 'time')
    return {
      name: 'ElTimePicker',
      props: { format: 'HH:mm:ss', valueFormat: 'HH:mm:ss' },
      immediate: true
    }

  if (t === 'datetime')
    return {
      name: 'ElDatePicker',
      props: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' },
      immediate: true
    }

  if (t === 'timestamp')
    return {
      name: 'ElDatePicker',
      props: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss.SSSSSS', valueFormat: 'YYYY-MM-DD HH:mm:ss.SSSSSS' },
      immediate: true
    }

  // 默认 input
  return { name: 'input', immediate: true }
}
const tableName = computed(() => {
  let cursql = sqlStore.data.sql
  // console.log('cursql', cursql)
  // let tablename = cursql.match(/FROM\s+([^\s;]+)/i)?.[1] ?? ''
  let tablename = pickTablesByAst(cursql, 'postgresql') // 或 postgresql / sqlite
  // console.log('tablename', tablename)
  return tablename[0] ?? '';
});
/* ==========  2. 响应式结果集  ========== */
const resultSet = reactive({
  columns: [],          // 动态列元数据
  rows: [],             // 真正数据
  executionTime: 0,
  affectedRows: 0,
  //哪个是自增列
  colSerial: '',
})

/* ==========  3. 把后端字段转成 vxe-columns  ========== */
const gridColumns = computed(() => {
  const cols = resultSet.columns.map(col => {
    const type = fieldMeta.value[col] || 'string'
    return {
      field: col,
      title: col,
      minWidth: 100,
      editRender: mapTypeToEditRender(type)
    }
  })

//   const cols = resultSet.columns.map(col => ({
//     field: col,
//     title: col,
//     minWidth: 160,
//     /* 关键：第一层就是 editRender，别再嵌套 */
//     // editRender: {
//     //   name: 'input',      // 4.x 内置
//     //   attrs: { type: 'time' } ,// HTML5 原生日期框
//     //   immediate: true
//     // }
//     editRender: {
//   name: 'ElDatePicker',
//   props: { type: 'date', format: 'YYYY-MM-DD', valueFormat: 'YYYY-MM-DD' },
//   immediate: true
// }
//   }))



  // 操作列
  cols.push({
    field: 'action',
    title: '操作',
    width: 110,
    fixed: 'right',
    slots: { default: 'action_slot' }
  })
  // console.log('cols', cols)
  return cols
})



/* 分页参数 */
const tablePage = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  layouts: ['PrevPage', 'JumpNumber', 'NextPage', 'Total'] 
})
const loading = ref(false)


/* 当前 SQL（不含 limit）和当前表名 */
const currentSql = ref('')
const currentTable = ref('')
/* ==========  4. 加载数据  ========== */
// 父组件可以调用 loadResult({ sql: 'select * from user' })
const loadResult = async (sqlText) => {
  executing.value = true
  try {
    // const res = await databaseApi.getdata(parm)   // ← 接口
    // 假定后端返回格式：
  console.log('loadResult sqlText:',sqlText)

    // const cleanedSql = sqlText.sql ? sqlText.sql.replace(/\r\n/g, ' '): sqlText.replace(/\r\n/g, ' ');
    const cleanedSql = (sqlText.sql || sqlText).replace(/[\r\n;]/g, ' ');
    currentSql.value = cleanedSql

    //先去接口跑一圈，如果data是空，说明不是select，那就直接返回执行正常或失败
    // const reschk = await databaseApi.executeSqlWithText({
    //   ...connStore.conn,
    //   oprationString: currentSql.value
    // })
    // if (reschk.code == 200 && reschk.data == null) {
    //   // console.log('reschk.code',reschk.code)
    //   currentSql.value = ''
    //   resultSet.value = null
    //   fieldMeta.value = null
    //   ElMessage.success(reschk.message)
    //   //通知树更新
    //   treeStore.triggerRefresh()
    //   return
    // }
    // if (reschk.code === 500)
    // {
    //   ElMessage.error('失败：' + reschk.message)
    //   currentSql.value = ''
    //   resultSet.value = null
    //   fieldMeta.value = null
    //   return
    // }
    let reschk = isSelectStatement(cleanedSql, 'postgresql')
    if (!reschk) {//非select语句就执行好后就不往下走，不分页了
      const notselectsql = await databaseApi.executeSqlWithText({
        ...connStore.conn,
        oprationString: currentSql.value
      })
          if (notselectsql.code == 200 && notselectsql.data == null) {
            // console.log('reschk.code',reschk.code)
            currentSql.value = ''
            resultSet.value = null
            fieldMeta.value = null
            ElMessage.success(notselectsql.message)
            //通知树更新
            treeStore.triggerRefresh()
            return
          }
          if (notselectsql.code === 500)
          {
            ElMessage.error('失败：' + notselectsql.message)
            currentSql.value = ''
            resultSet.value = null
            fieldMeta.value = null
            return
          }
    }
    // console.log('cleanedSql',cleanedSql)
    if(cleanedSql)
    {
        //TODO:不支持多表联查
        // let countsql = " SELECT COUNT(*) FROM " + tableName.value + "  "
        //   /* 3. 拿总条数 —— 用你提供的 count 接口 */
        // const countRes = await databaseApi.executeSqlWithText({
        //   ...connStore.conn,
        //   oprationString: countsql,   // 你新接口需要的参数
        // })
        // // console.log('countRes',countRes)
        // if (countRes.code !== 200) {
        //   ElMessage.error('获取行数失败：' + countRes.message)
        //   return
        // }
        // tablePage.total = countRes.data.data[0].count   // 接口返回数字
        // console.log('tablePage.totalResult',tablePage.total)
        tablePage.currentPage = 1
        await loadPage(1, tablePage.pageSize)
                       
    }
  } catch (e) {
  } finally {
    executing.value = false
  }
}

function parseType(dt) {
  const t = (dt || '').toLowerCase();
  if (t.includes('datetime')) return 'datetime';
  if (t.includes('timestamp')) return 'datetime';
  if (t.includes('date') && t.includes('time')) return 'datetime';
  if (t.includes('date')) return 'date';
  if (t.includes('time')) return 'time';
  // 可以继续扩展：bit/bool、int/number、decimal 等
  return 'string';   // 默认走 input
}

const loadPage = async (page, size) => {
  loading.value = true
  try {
    // console.log('loadPage',page,size)
    /* 构造 limit 语句（MySQL 语法） */
    let sql = currentSql.value
    if(!hasLimitClause(currentSql.value))
    {
      // console.log('loadPage',sql)
        sql = `${currentSql.value} LIMIT ${size} OFFSET ${(page - 1) * size}`
    }
    
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    // console.log('loadPage',res)
    if (res.code !== 200) {
      ElMessage.error('分页查询失败：' + res.message)
      return
    }

    
    const res2 = await databaseApi.getTableInfo({
                  ...connStore.conn,
                  oprationString: tableName.value
                })
                // console.log('getTableInfo',res2)
                if(res2.code === 200)
                {

                  let fields = res2.data.fields
                  // 2. 过滤出 isauto = true 的字段
                  let autoColumns = fields.filter(f => f.isauto)
                  // 3. 只拿 column_name
                  let autoColumnNames = autoColumns.map(f => f.column_name)
                  resultSet.colSerial = autoColumnNames[0];

                  let list = res2.data.fields;
                  //   const { data } = await getTableStruct() // 返回示例  [{field:'birthday',type:'date'}, ...]
                  // data.forEach(i => (meta[i.field] = i.type))
                  // fieldMeta.value = meta
                  // console.log('columns111', gridColumns.value)
                  fieldMeta.value = list.reduce((meta, item) => {
                    meta[item.column_name] = parseType(item.data_type);
                    return meta;
                  }, {});
                  // console.log('fieldMeta.value',fieldMeta.value)
                }
            resultSet.columns = res.data.columns || []

            // console.log('columns222', gridColumns.value)
            // const emptyRow = Object.fromEntries(res.data.columns.map(k => [k, '']))
            resultSet.rows = res.data.data && res.data.data.length > 0 ? res.data.data : []
            tablePage.total = res.data.rowCount
            resultSet.affectedRows  =  0
  }catch(e){
            console.log('执行失败 错误信息:' + e.message)
          } finally {
    loading.value = false
    //通知树更新,查询不要通知树更新
    // treeStore.triggerRefresh()
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

function rowToWherev3(row) {
  const setList = []
  setList.push(` ${pkField.value} = ${curID.value} `)
  resultSet.columns.forEach(col => {
    if (col != pkField.value)
    {
      setList.push(`${col} = ${formatValue(row[col])}`)
    }
  })
  return setList
}

function rowToWherev4(oldrow) {
  return Object
    .entries(oldrow)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) =>
      v === null
        ? `${quoteId(k)} IS NULL`                       
        : `${quoteId(k)} = '${String(v).replace(/'/g, "''")}'`  
    )
    .join(' AND ');
}

/* ===== 工具函数：值转 SQL 字面量 ===== */
function formatValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (v === '') return 'NULL'
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
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
    // grid.setActiveRow(resultSet.rows[0]) // 自动进入编辑
    grid.setEditRow(resultSet.rows[0])
  })

}

/* ========== 2. 确认新增 -> 拼 INSERT -> 调接口 ========== */
async function handleConfirmInsert() {
  const row = resultSet.rows[0]
  const fields = []
  const values = []
  resultSet.columns.forEach(col => {
    // fields.push(`\`${col}\``)
    // console.log('row[col]',row[col])
    // console.log('formatValue(row[col])',formatValue(row[col]))
    if(col == resultSet.colSerial && row[col] == '')
    {}else
    {
      fields.push(quoteId(col))
      values.push(formatValue(row[col]))
    }
  })
  let cursql = sqlStore.data.sql
  let tablename = cursql.match(/FROM\s+([^\s;]+)/i)?.[1] ?? ''
  const sql = " INSERT INTO " + tablename + " ( " + fields.join(',') + " ) VALUES ( " + values.join(',') + ") ;"
  // console.log('sql',sql)
  try {
    const res = await databaseApi.executeSqlWithText({
      ...connStore.conn,
      oprationString: sql
    })
    // console.log('res222',res)
    if (res.code === 200) {
      ElMessage.success('新增成功')
    } else {
      ElMessage.error('新增失败：' + res.message)
    }
  } catch (e) {
    ElMessage.error('新增异常：' + e.message)
  }finally {
    addLocked.value = false
    await reloadQuery() // 重新查一遍
  }
}

/* 取消编辑：不保存，直接退出 */
function cancelEdit(row) {
const $grid = xGrid.value
  $grid.revertData(row)   // 4.16.7 可用
  $grid.clearActived()    // 退出激活
  row.__editing = false
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


/* 进入编辑 */
function startEdit(row) {
  const grid = xGrid.value
  // console.log('row',row)
  // grid.setActiveRow(row)    
  grid.setEditRow(row)
  nextTick(() => xGrid.value.setEditRow(row))
  curID.value = formatValue(row[pkField.value])       // 让该行进入编辑
  // grid.setRowCache(row) 
  row.__old = { ...row }
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
    // console.log('row',row)
    try {

    const sql = `DELETE FROM ${tableName.value}  WHERE ${rowToWherev4(row)} `

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
      setList.push(`${quoteId(col)} = ${formatValue(row[col])}`) // 这里就是用户编辑后的值
    })
    
    const sql = `UPDATE ${tableName.value} SET ${setList.join(',')} WHERE ${rowToWherev4(row.__old)} `
    console.log('sql', sql)
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

const handlePageChange = ({ currentPage, pageSize }) => {
  tablePage.currentPage = currentPage
  tablePage.pageSize    = pageSize
  loadPage(currentPage, pageSize)
}
</script>

<style scoped>
.grid-wrapper {
  flex: 1;
  min-height: 505px;
  padding: 8px;
  overflow-y: auto;
}

.grid-toolbar {
  display: flex;
  align-items: center;
  padding: 0 30px;
}

/* 按钮组占满左侧剩余空间，把表名顶到最右 */
.btn-box {
  display: inline-flex;   /* 让按钮在一行 */
  flex-wrap: nowrap;      /* 坚决不换行 */
  gap: 6px;               /* 按钮间距，不喜欢可改成 4px 或 8px */
  margin-right: auto;     /* 继续把表名顶到最右 */
}
.btn-box .el-button {
  white-space: nowrap;
  flex-shrink: 0;         /* 不让按钮被压缩到换行 */
}

/* 表名本身不需要额外样式就能贴在右边 */
.table-name {
  /* 可选：微调与按钮间距 */
  margin-left: auto;   /* 关键：顶到最右 */
  padding-right: 12px; /* 右边留空，不需要 position */
}

.el-button--mini {
  height: 20px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}
</style>
