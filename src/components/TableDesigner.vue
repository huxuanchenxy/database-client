<template>
  <el-dialog
    v-model="visible"
    title="表结构设计器"
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
      :model-value="oldTable ? alterPreview : sqlPreview"
      readonly
    />

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed,watch } from 'vue'
import { useConnStore } from '@/stores/conn'
import { databaseApi } from '@/api/api'
import { useTreeStore } from '@/stores/treeStore'
import { ElMessage,ElMessageBox } from 'element-plus'
const treeStore = useTreeStore()
const connStore = useConnStore()
const visible = ref(false)

const table = ref({
  name: '',
  comment: '',
  fields: []
})

const isDisabled = ref(false)

function parseDataType(dt) {
  const m = dt.match(/^(\w+)(?:\((.+)\))?$/)
  if (!m) return { type: dt, length: null }
  return { type: m[1].toLowerCase(), length: m[2] ?? null }
}

/* 1. 标志位 */
const touched = ref(false)

/* 2. 监听字段变化 */
watch(
  () => table.value.fields,
  () => { touched.value = true },
  { deep: true }
)

/* 1. 存一份原始字段名数组 */
const oldFieldNames = ref([])
const oldTable = ref(null) 
/* 实时 ALTER 预览 */
const alterPreview = computed(() => {
  if (!oldTable.value) return ''          // 新建表模式
  if (!touched.value) return ''           // <<<<< 刚打开，用户啥都没动
  const alters = diffAlterTable()
  return alters.length ? alters.join('\n') : '-- 结构无变化'
})
const openDialog = async (initial = null) => {
  visible.value = true
  touched.value = false
  if (initial) {
    isDisabled.value = true
    const res = await databaseApi.getTableInfo({
      ...connStore.conn,
      oprationString: initial
    })
    if (res.code !== 200) return ElMessage.error('获取表信息失败')

    const fields = res.data.fields.map(f => {
      const { type, length } = parseDataType(f.data_type)
      return { ...f, type, length }
    })

    /* 关键：同时给 table 和 oldTable 赋值 */
    table.value = { name: initial, comment: '', fields }
    oldTable.value = JSON.parse(JSON.stringify(table.value))   // <<<<< 就加这一句
    oldFieldNames.value = fields.map(f => f.column_name)

  } else {
    isDisabled.value = false
    table.value = { name: '', comment: '', fields: [] }
    oldTable.value = null   // 新建表模式
    oldFieldNames.value = []
  }
}

/* 2. 比对函数：返回 rename 映射  { 旧名: 新名 } */
function detectRenames () {
  const rename = {}
  const newNames = table.value.fields.map(f => f.column_name)
  oldFieldNames.value.forEach((old, idx) => {
    const nw = newNames[idx]
    if (nw && nw !== old) rename[old] = nw
  })
  return rename
}

/* 3. 生成 ALTER 语句（在 save 里调用）*/
function diffAlterTable () {
  const alters = []
  const tn = table.value.name
  /* 只拿有效字段做对比 */
  const validFields = table.value.fields.filter(f => f.column_name.trim())

  const oldMap = Object.fromEntries(
    oldTable.value.fields.map(f => [f.column_name, f])
  )

  /* 重命名检测 */
  const rename = detectRenames()

  /* 1. 重命名 */
  for (const [oldName, newName] of Object.entries(rename)) {
    alters.push(`ALTER TABLE ${tn} RENAME COLUMN ${oldName} TO ${newName};`)
    delete oldMap[oldName]
  }

  /* 2. 删除字段（剩下的旧字段）*/
  for (const oldName of Object.keys(oldMap)) {
    alters.push(`ALTER TABLE ${tn} DROP COLUMN ${oldName};`)
  }

  /* 3. 新增字段（validFields 比旧表多出的部分）*/
  const addCount = validFields.length - oldFieldNames.value.length
  if (addCount > 0) {
    for (let i = oldFieldNames.value.length; i < validFields.length; i++) {
      alters.push(`ALTER TABLE ${tn} ADD COLUMN ${colDef(validFields[i])};`)
    }
  }

  /* 4. 改类型/可空/主键（只比对 validFields）*/
  validFields.forEach(f => {
    const srcName = Object.entries(rename).find(([, n]) => n === f.column_name)?.[0] || f.column_name
    const o = oldTable.value.fields.find(v => v.column_name === srcName)
    if (!o) return   // 新增字段已处理

    /* 类型 */
    if (o.type !== f.type || o.length !== f.length) {
      let nt = f.type
      if (f.length && ['varchar', 'int', 'bigint'].includes(f.type)) nt += `(${f.length})`
      alters.push(`ALTER TABLE ${tn} ALTER COLUMN ${f.column_name} TYPE ${nt} USING ${f.column_name}::${nt};`)
    }
    /* 可空 */
    if (o.is_not_null !== f.is_not_null) {
      alters.push(
        f.is_not_null
          ? `ALTER TABLE ${tn} ALTER COLUMN ${f.column_name} SET NOT NULL;`
          : `ALTER TABLE ${tn} ALTER COLUMN ${f.column_name} DROP NOT NULL;`
      )
    }
    /* 主键 */
    if (o.ispk !== f.ispk) {
      if (o.ispk) alters.push(`ALTER TABLE ${tn} DROP CONSTRAINT ${tn}_pkey;`)
      if (f.ispk) alters.push(`ALTER TABLE ${tn} ADD PRIMARY KEY (${f.column_name});`)
    }
  })

  return alters
}

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

const removeField = (index) => {
  table.value.fields.splice(index, 1)
}

const sqlPreview = computed(() => {
  const { name, comment, fields } = table.value
  if (!name || !fields.length) return '-- 请输入表名并添加字段'

  const lines = fields.map(f => {
    const parts = [f.column_name]          // ← 反引号已去掉
    let type = f.type
    if (f.length && ['varchar', 'int', 'bigint'].includes(f.type)) {
      type += `(${f.length})`
    }
    parts.push(type)
    if (f.is_not_null) parts.push('NOT NULL')
    if (f.ispk) parts.push('PRIMARY KEY')
    if (f.comment) parts.push(`COMMENT '${f.comment}'`)
    return '  ' + parts.join(' ')
  })

  let sql = `CREATE TABLE ${name} (\n`  // ← 表名反引号已去掉
  sql += lines.join(',\n')
  sql += '\n);'
//   if (comment) sql += `\nALTER TABLE ${name} COMMENT='${comment}';`  // ← 同样去掉
  return sql
})

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
      ElMessage.error('创建表失败:' + res.message)
    }

}

defineExpose({ openDialog })
</script>