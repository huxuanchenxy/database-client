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
          
           <div class="btn-box" v-if="showbutton" >
          <el-button v-if="resultSet.columns.length > 0 "
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
                  <template v-if="!row.__editing && addLocked === false && showbutton">
                    <el-button class="edit-btn" size="mini" @click="startEdit(row)">
                      编辑
                    </el-button>
                    <el-button class="del-btn" size="mini" @click="startDelete(row)">
                      删除
                    </el-button>
                  </template>

                  <!-- 编辑中状态 -->
                  <template v-else>
                    <el-button v-if="addLocked === false && showbutton"
                      type="success"
                      size="mini"
                      :loading="row.__saving"
                      @click="confirmEdit(row)">
                      确认
                    </el-button>
                    <el-button v-if="addLocked === false && showbutton"
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
import { pickTablesByAst,isSelectStatement,hasLimitClause ,isSelectStatementV2,hasOrderByClause} from '@/utils/sqlTableAst'
import { quoteId } from '@/utils/db.js'
const sqlStore = useSqlStore()
const connStore = useConnStore()
const treeStore = useTreeStore()
const localData = ref({ sql: '', result: null })
const emit = defineEmits(['calltree'])
const showbutton = ref(false)
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
      props: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' },
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
  caozuo:true,
})


function jsonEditRender() {
  // console.log('jsonEditRender init')
  return {
    // 使用内置 renderer 名称 'input' 或 '$input' 更保险（避免组件解析错误）
    name: 'input',
    props: {
      type: 'text',
      maxlength: 20000,
      autofocus: true
    },
    // 关键：把两个参数都打印出来（slotParams, eventParams）
    events: {
      input(slotParams, eventParams) {
        // 这两行能让你立刻看到到底哪个参数携带 value
        // console.log('[jsonEditRender] input slotParams:', slotParams)
        // console.log('[jsonEditRender] input eventParams:', eventParams)

        // eventParams.value 通常是最新输入值（有些版本事件会把 value 放在第二参）
        const text = (eventParams && eventParams.value !== undefined)
          ? eventParams.value
          : (slotParams && slotParams.value)

        // 尝试 parse 回写 row 字段（仅示范）
        try {
          slotParams.row[slotParams.column.field] = JSON.parse(text)
        } catch (e) {
          slotParams.row[slotParams.column.field] = text
        }
      },
      // 你也可以监听 change/blur 等
      change(slotParams, eventParams) {
        // console.log('[jsonEditRender] change', slotParams, eventParams)
      }
    },
    // type: 'default' 可视/非可视差异按需选
    // type: 'visible' // 如果想编辑器一直可见（调试时可以尝试）
    // attrs/props/other config...
  }
}

/* ==========  3. 把后端字段转成 vxe-columns  ========== */
const gridColumns = computed(() => {
  const cols = resultSet.columns.map(col => {
    const type = fieldMeta.value[col] || 'string'

    const baseCol = {
      field: col,
      title: col,
      minWidth: 100
    }

    if (type === 24 || type === 'regtype' || type === 'oid') {
      // 显示时格式化成 JSON 字符串
      baseCol.formatter = ({ cellValue }) =>
        typeof cellValue === 'object'
          ? JSON.stringify(cellValue, null, 2)
          : cellValue

      // 编辑时用输入框
      baseCol.editRender = jsonEditRender()
    } else {
      baseCol.editRender = mapTypeToEditRender(type) // 其它列走老逻辑
    }

    return baseCol
  })

  if(resultSet.caozuo && resultSet.columns && resultSet.columns.length > 0)
  {
    // 操作列
    cols.push({
      field: 'action',
      title: '操作',
      width: 110,
      fixed: 'right',
      slots: { default: 'action_slot' }
    })
  }
  

  // console.log('final gridColumns:', cols)
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
  // console.log('loadResult sqlText:',sqlText)

    // const cleanedSql = sqlText.sql ? sqlText.sql.replace(/\r\n/g, ' '): sqlText.replace(/\r\n/g, ' ');
    const cleanedSql = (sqlText.sql || sqlText).replace(/[\r\n]/g, ' ');
    currentSql.value = cleanedSql


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
  if (t.includes('oid')) return 'oid';
  // 可以继续扩展：bit/bool、int/number、decimal 等
  return 'string';   // 默认走 input
}

const loadPage = async (page, size) => {
  showbutton.value = false
  loading.value = true
  try {
    // console.log('loadPage',page,size)
    /* 构造 limit 语句（MySQL 语法） */
    let sql = currentSql.value.replace(/[\r\n;]/g, ' ');
    //如果没有order by 则加上 order by 第一个字段
    if(!hasOrderByClause(sql))
    {
        sql = `${sql} order by 1 `
    }

    //要没有limit而且是from的select语句
    if(!hasLimitClause(sql))
    {
      // console.log('loadPage',sql)
        sql = `${sql} LIMIT ${size} OFFSET ${(page - 1) * size} `
    }
    if(isSelectStatementV2(sql))
    {
        //有from的正常语句
        showbutton.value = true
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
                  // console.log('fieldMeta.value111', list)
                  fieldMeta.value = list.reduce((meta, item) => {
                    meta[item.column_name] = parseType(item.data_type);
                    return meta;
                  }, {});
                  // console.log('fieldMeta.value222',fieldMeta.value)
                }
                // console.log('res.data.columns',res.data.columns)
            resultSet.columns = res.data.columns || []

            // console.log('columns222', gridColumns.value)
            // const emptyRow = Object.fromEntries(res.data.columns.map(k => [k, '']))
            resultSet.rows = res.data.data && res.data.data.length > 0 ? res.data.data : []
            tablePage.total = res.data.rowCount
            resultSet.affectedRows  =  0
            resultSet.caozuo = true
            if(res.data.isSysTb)
            {
              showbutton.value = false
              resultSet.caozuo = false
            }
            await nextTick();
            xGrid.value.reloadColumn(gridColumns.value); 
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



function rowToWherev4(oldRow) {
  return Object
    .entries(oldRow)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => {
      if (v === null) {
        return `${quoteId(k)} IS NULL`
      }
      // 如果是 datetime，只比到秒
      if (fieldMeta.value[k] === 'datetime') {
        // 去掉毫秒部分，保证格式 2025-09-22 13:49:53
        const secStr = String(v).replace(/\.\d+$/, '')
        return `date_trunc('second', ${quoteId(k)}) = timestamp '${secStr}'`
      }
      // 普通字段保持原样
      return `${quoteId(k)} = '${String(v).replace(/'/g, "''")}'`
    })
    .join(' AND ')
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
    // 1. 把对象列提前转成 JSON 字符串
  resultSet.columns.forEach(col => {
    const type = fieldMeta.value[col]
    if ((type === 24 || type === 'regtype' || type === 'oid') && typeof row[col] === 'object') {
      row[col] = JSON.stringify(row[col], null, 2)
    }
  })
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

    // 2. 把字符串列再解析回对象
    resultSet.columns.forEach(col => {
      const type = fieldMeta.value[col]
      if ((type === 24 || type === 'regtype' || type === 'oid') && typeof row[col] === 'string') {
        try { row[col] = JSON.parse(row[col]) } catch { /* 留字符串 */ }
      }
    })

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

:deep(.vxe-table .vxe-body--row.row--stripe > td) {
  background-color: #DCE7FF !important;   /* 想换啥色就改这里 */
}

:deep(.vxe-table .vxe-header--row .vxe-header--column) {
  background-color: #DCE7FF !important;   /* 背景 */
}
</style>
