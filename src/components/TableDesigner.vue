<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="80%"
    top="5vh"
    :close-on-click-modal="false"
  >
    <el-form :model="table" label-width="80px">
      <el-form-item label="表名">
        <el-input v-model="table.name" placeholder="表名（如：user）" :disabled="isDisabled" />
      </el-form-item>
      <!-- <el-form-item label="注释">
        <el-input v-model="table.comment" placeholder="表注释" />
      </el-form-item> -->
    </el-form>

    <el-divider>字段列表</el-divider>

    <el-table :data="table.fields" border size="small" style="width: 100%">
      <el-table-column label="字段名" width="140">
        <template #default="{ row }">
          <el-input v-model="row.column_name" size="small" />
        </template>
      </el-table-column>

      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small">
            <el-option label="integer" value="integer" />
            <el-option label="varchar" value="varchar" />
            <el-option label="date" value="date" />
            <el-option label="time" value="time" />
            <el-option label="text" value="text" />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="长度" width="90">
        <template #default="{ row }">
          <el-input v-model="row.length" size="small" />
        </template>
      </el-table-column>

      <el-table-column label="非 null" width="80">
        <template #default="{ row }">
          <el-checkbox v-model="row.is_not_null" />
        </template>
      </el-table-column>

      <el-table-column label="主键" width="80">
        <template #default="{ row }">
          <el-checkbox v-model="row.ispk" />
        </template>
      </el-table-column>

      <el-table-column label="注释">
        <template #default="{ row }">
          <el-input v-model="row.comment" size="small" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="100">
        <template #default="{ $index }">
          <el-button type="text" @click="removeField($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 10px">
      <el-button type="primary" size="small" @click="addField">+ 添加字段</el-button>
    </div>

    <el-divider>SQL 预览</el-divider>

    <el-input
      type="textarea"
      :rows="8"
      :model-value="sqlPreview"
      
    />

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed,watch,nextTick  } from 'vue'
import { useConnStore } from '@/stores/conn'
import { databaseApi } from '@/api/api'
import { useTreeStore } from '@/stores/treeStore'
import { ElMessage,ElMessageBox } from 'element-plus'
const treeStore = useTreeStore()
const connStore = useConnStore()
const visible = ref(false)
const isDisabled = ref(false)
const table = ref({
  name: '',
  comment: '',
  fields: []
})
const oldTable = ref(null) 

const dialogTitle = computed(() =>
  isDisabled.value ? '修改表结构' : '新建表结构'
)
// function parseDataType(dt) {
//   const m = dt.match(/^(\w+)(?:\((.+)\))?$/)
//   if (!m) return { type: dt, length: null }
//   return { type: m[1].toLowerCase(), length: m[2] ?? null }
// }

/* ---------- 打开弹窗 ---------- */
const openDialog = async (initialTableName = null) => {
  visible.value = true
    // 1. 先把 oldTable 置空，防止上一次残留
  oldTable.value = null
//   table.value = { name: '', comment: '', fields: [] }
  if (initialTableName) {
    /* ---------- 修改模式 ---------- */
    isDisabled.value = true
    const res = await databaseApi.getTableInfo({
      ...connStore.conn,
      oprationString: initialTableName
    })
    if (res.code !== 200) return ElMessage.error('获取表信息失败')
    const fields = res.data.fields.map(f => {
      const { type, length } = parseDataType(f.data_type)
      return { ...f, type, length }
    })
        // 2. 先填充当前编辑态
    table.value = { name: initialTableName, comment: '', fields }

    // 3. 等 DOM 更新完再缓存“旧结构”，保证 oldTable 只写一次
    await nextTick()
    oldTable.value = JSON.parse(JSON.stringify(table.value))
    console.log('oldTable111',oldTable.value)
  } else {
    /* ---------- 新建模式 ---------- */
    isDisabled.value = false
    table.value = { name: '', comment: '', fields: [] }
  }
}
/* ---------- 字段增删 ---------- */
const addField = () => {
  table.value.fields.push({
    column_name: '',
    type: '',
    length: '',
    is_not_null: false,
    ispk: false,
    comment: ''
  })
}
const removeField = async (idx) => {
  await ElMessageBox.confirm('确定删除该列？', '提示', { type: 'warning' })
  table.value.fields.splice(idx, 1)
}

/* ---------- SQL 预览 ---------- */
const sqlPreview = computed(() => {
//   if (!isDisabled.value) return buildCreateSql(table.value)      // 新建
//   return buildAlterSql(oldTable.value, table.value)                    // 修改
})

/* ---------- 生成 CREATE TABLE ---------- */
function buildCreateSql(t) {
  if (!t.name) return '-- 请输入表名'
  if (!t.fields.length) return '-- 请添加字段'
  const cols = []
  const pks = []
  t.fields.forEach(f => {
    let line = `  ${quoteId(f.column_name)} ${buildDataType(f)}`
    if (f.is_not_null) line += ' NOT NULL'
    if (f.comment) line += ` COMMENT ${escapeStr(f.comment)}`
    cols.push(line)
    if (f.ispk) pks.push(quoteId(f.column_name))
  })
  if (pks.length) cols.push(`  PRIMARY KEY (${pks.join(',')})`)
  return `CREATE TABLE ${quoteId(t.name)} (\n${cols.join(',\n')}\n);`
}

/* ---------- 生成 ALTER TABLE ---------- */
function buildAlterSql(old, curr) {
    // console.log('buildAlterSql old',old)//为空
    // console.log('buildAlterSql curr',curr)
  if (!old || !curr) return ''
  const alterList = []
  const oldMap = Object.fromEntries(old.fields.map(f => [f.column_name, f]))
  const currMap = Object.fromEntries(curr.fields.map(f => [f.column_name, f]))

  // 1. 删除的列
  old.fields.forEach(of => {
    if (!currMap[of.column_name]) {
      alterList.push(`ALTER TABLE ${quoteId(curr.name)} DROP COLUMN ${quoteId(of.column_name)};`)
    }
  })

  // 2. 新增列
  curr.fields.forEach(cf => {
    if (!oldMap[cf.column_name]) {
      let line = `ADD COLUMN ${quoteId(cf.column_name)} ${buildDataType(cf)}`
      if (cf.is_not_null) line += ' NOT NULL'
      alterList.push(`ALTER TABLE ${quoteId(curr.name)} ${line};`)
      // 主键/注释额外语句
      if (cf.comment) alterList.push(`COMMENT ON COLUMN ${quoteId(curr.name)}.${quoteId(cf.column_name)} IS ${escapeStr(cf.comment)};`)
      return
    }

    // 3. 修改列（类型、长度、可空性、注释、主键）
    const of = oldMap[cf.column_name]
    // 3.1 类型/长度
    if (of.type !== cf.type || of.length !== cf.length) {
      alterList.push(`ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} TYPE ${buildDataType(cf)};`)
    }
    // 3.2 非 null
    if (of.is_not_null !== cf.is_not_null) {
      const setDrop = cf.is_not_null ? 'SET NOT NULL' : 'DROP NOT NULL'
      alterList.push(`ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} ${setDrop};`)
    }
    // 3.3 注释
    if (of.comment !== cf.comment) {
      alterList.push(`COMMENT ON COLUMN ${quoteId(curr.name)}.${quoteId(cf.column_name)} IS ${escapeStr(cf.comment || '')};`)
    }
    // 3.4 主键变化（先暴力全部删再全部加，最简单）
  })

  // 4. 主键变更（整表维度）
  const oldPks = old.fields.filter(f => f.ispk).map(f => f.column_name).sort()
  const currPks = curr.fields.filter(f => f.ispk).map(f => f.column_name).sort()
  if (oldPks.join() !== currPks.join()) {
    if (oldPks.length) alterList.push(`ALTER TABLE ${quoteId(curr.name)} DROP CONSTRAINT IF EXISTS ${quoteId(curr.name + '_pkey')};`)
    if (currPks.length) alterList.push(`ALTER TABLE ${quoteId(curr.name)} ADD PRIMARY KEY (${currPks.map(quoteId).join(',')});`)
  }

  return alterList.length ? alterList.join('\n') : '-- 暂无改动'
}

/* ---------- 工具函数 ---------- */
function parseDataType(dt) {
  // 把后端返回的 data_type 拆成 { type, length }
  // 例：character varying(120) => varchar, 120
  const m = dt.match(/^(\w+(?:\s+\w+)*)(?:\((\d+)\))?$/)
  let t = m ? m[1].replace(/\s+/g, ' ') : dt
  if (t === 'character varying') t = 'varchar'
  return { type: t, length: m && m[2] ? m[2] : '' }
}
function buildDataType(f) {
  if (f.type === 'varchar' && f.length) return `varchar(${f.length})`
  return f.type
}
function quoteId(s) {
  return '"' + String(s).replace(/"/g, '""') + '"'
}
function escapeStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'"
}

const save = async () => {
//   console.log('保存表结构：', table.value)
//   console.log('生成 SQL：', sqlPreview.value)
  visible.value = false
    const parm = {
      ...connStore.conn,
      oprationString: sqlPreview.value, 
    }
    
    const res = await databaseApi.executeSqlWithText(parm)
    if(res.code === 200) {
      ElMessage.success('创建表成功')
      treeStore.triggerRefresh()
    }
    else {
      ElMessage.error('失败:' + res.message)
    }

}

defineExpose({ openDialog })
</script>