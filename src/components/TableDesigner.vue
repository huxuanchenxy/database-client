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
        <el-input v-model="table.name" placeholder="表名（如：user）" />
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
          <el-checkbox v-model="row.ispk"
          @change="() => setPrimaryKey(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="自增" width="70">
        <template #default="{ row }">
            <el-checkbox v-model="row.isSerial" :disabled="row.type!=='integer'"
            @change="val => { if (val) row.is_not_null = true }"
            />
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
    // console.log('表结构',res)
    if (res.code !== 200) return ElMessage.error('获取表信息失败')
    const fields = res.data.fields.map(f => {
      const { type, length } = parseDataType(f.data_type)
      return { ...f, type, length,old_name: f.column_name,isSerial:f.isauto }
    })
        // 2. 先填充当前编辑态
    table.value = { name: initialTableName, comment: '', fields }

    // 3. 等 DOM 更新完再缓存“旧结构”，保证 oldTable 只写一次
    await nextTick()
    oldTable.value = JSON.parse(JSON.stringify(table.value))
    // console.log('oldTable111',oldTable.value)
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
    isSerial: false,
    comment: ''
  })
}
const removeField = async (idx) => {
  await ElMessageBox.confirm('确定删除该列？', '提示', { type: 'warning' })
  table.value.fields.splice(idx, 1)
}

/* ---------- SQL 预览 ---------- */
const sqlPreview = computed(() => {
  if (!isDisabled.value) return buildCreateSql(table.value)      // 新建
  return buildAlterSql(oldTable.value, table.value)                    // 修改
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

/* ---------- 生成 ALTER TABLE（PostgreSQL 版） ---------- */
function buildAlterSql(old, curr) {
  if (!old || !curr) return ''

  const alterList = []

  /* 0. 表名变更（优先级最高） */
  if (old.name !== curr.name) {
    alterList.push(
      `ALTER TABLE ${quoteId(old.name)} RENAME TO ${quoteId(curr.name)};`
    )
  }

  /* 1. 删除的列（先跳过那些被重命名的） */
  const oldMap = Object.fromEntries(old.fields.map(f => [f.column_name, f]))
  const currMap = Object.fromEntries(curr.fields.map(f => [f.column_name, f]))

  old.fields.forEach(of => {
    const renamed = curr.fields.find(
      cf => cf.old_name === of.column_name && cf.column_name !== of.column_name
    )
    if (renamed) return // 有对应重命名，不做 DROP
    if (!currMap[of.column_name]) {
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} DROP COLUMN ${quoteId(of.column_name)};`
      )
    }
  })

  /* 2. 新增 / 修改 的列 */
  curr.fields.forEach(cf => {
    const of = oldMap[cf.old_name || cf.column_name]

    /* 2.1 列名变更 → RENAME */
    if (cf.old_name && cf.old_name !== cf.column_name) {
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} RENAME COLUMN ${quoteId(cf.old_name)} TO ${quoteId(cf.column_name)};`
      )
    }

    if (!of) {
      /* 2.2 全新列 */
      let line = `ADD COLUMN ${quoteId(cf.column_name)} ${buildDataType(cf)}`
      if (cf.is_not_null) line += ' NOT NULL'
      alterList.push(`ALTER TABLE ${quoteId(curr.name)} ${line};`)
      if (cf.comment) {
        alterList.push(
          `COMMENT ON COLUMN ${quoteId(curr.name)}.${quoteId(cf.column_name)} IS ${escapeStr(cf.comment)};`
        )
      }
      return
    }

    /* 2.3 identity / serial 变化 */
    const oldIsSerial = of.isSerial || false
    const currIsSerial = cf.isSerial || false

    if (oldIsSerial && !currIsSerial) {
      /* 取消自增：identity → integer */
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} DROP IDENTITY IF EXISTS;`
      )
    } else if (!oldIsSerial && currIsSerial) {
      /* 新增自增：integer → identity */
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} ADD GENERATED BY DEFAULT AS IDENTITY;`
      )
    }

    /* 2.4 普通类型 / 长度变更（含 identity→identity 但长度变了） */
    /* 2.4 普通类型 / 长度变更 */
    if (of.type !== cf.type || of.length !== cf.length) {
      const typeSql = buildDataType(cf)
      let usingClause = ''

      /* 文本 → 数值类需要 USING */
      const textTypes = ['varchar', 'text', 'char']
      const numTypes = ['integer', 'bigint', 'numeric', 'real', 'double precision']

      if (of.type !== cf.type && numTypes.includes(cf.type)) {
        usingClause = ` USING (NULLIF(trim(${quoteId(cf.column_name)}::text), '')::${cf.type})`
      }

      const timeTypes = ['time','timetz','timestamp','timestamptz']

      if (numTypes.includes(of.type) && timeTypes.includes(cf.type)) {
        /* 按“秒数”转时间 */
        usingClause = ` USING (make_time(0,0,0) + make_interval(secs => ${quoteId(cf.column_name)}))`
      }

      const dateTypes  = ['date','timestamp','timestamptz']
      /* integer → date / timestamp */
      if (numTypes.includes(of.type) && dateTypes.includes(cf.type)) {
        usingClause = ` USING (to_timestamp(${quoteId(cf.column_name)})::${cf.type})`
      }

      /* date / timestamp → integer */
      if (dateTypes.includes(of.type) && numTypes.includes(cf.type)) {
        usingClause = ` USING (extract(epoch FROM ${quoteId(cf.column_name)}))`
      }
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} TYPE ${typeSql}${usingClause};`
      )
    }

    /* 2.5 可空性 */
    if (of.is_not_null !== cf.is_not_null) {
      const setDrop = cf.is_not_null ? 'SET NOT NULL' : 'DROP NOT NULL'
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} ALTER COLUMN ${quoteId(cf.column_name)} ${setDrop};`
      )
    }

    /* 2.6 注释 */
    if (of.comment !== cf.comment) {
      alterList.push(
        `COMMENT ON COLUMN ${quoteId(curr.name)}.${quoteId(cf.column_name)} IS ${escapeStr(cf.comment || '')};`
      )
    }
  })

  /* 3. 主键变更 */
  const oldPks = old.fields.filter(f => f.ispk).map(f => f.column_name).sort()
  const currPks = curr.fields.filter(f => f.ispk).map(f => f.column_name).sort()

  if (oldPks.join() !== currPks.join()) {
    if (oldPks.length) {
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} DROP CONSTRAINT IF EXISTS ${quoteId(curr.name + '_pkey')};`
      )
    }
    if (currPks.length) {
      alterList.push(
        `ALTER TABLE ${quoteId(curr.name)} ADD PRIMARY KEY (${currPks.map(quoteId).join(',')});`
      )
    }
  }

  return alterList.length ? alterList.join('\n') : '-- 暂无改动'
}


/* ---------- 工具函数 ---------- */
// function parseDataType(dt) {
//   // 把后端返回的 data_type 拆成 { type, length }
//   // 例：character varying(120) => varchar, 120
//   const m = dt.match(/^(\w+(?:\s+\w+)*)(?:\((\d+)\))?$/)
//   let t = m ? m[1].replace(/\s+/g, ' ') : dt
//   if (t === 'character varying') t = 'varchar'
//   return { type: t, length: m && m[2] ? m[2] : '' }
// }
function parseDataType(dt) {
  const m = dt.match(/^(\w+(?:\s+\w+)*)(?:\((\d+)\))?$/i)
  let t = m ? m[1].replace(/\s+/g, ' ') : dt
  if (t === 'character varying') t = 'varchar'
  if (t === 'serial' || t === 'bigserial') {
    return { type: 'integer', length: '', isSerial: true }
  }
  return { type: t, length: m && m[2] ? m[2] : '', isSerial: false }
}
// function buildDataType(f) {
//   if (f.type === 'varchar' && f.length) return `varchar(${f.length})`
//   return f.type
// }
function buildDataType(f) {
  // if (f.isSerial) return 'serial'
  if (f.isSerial) return ' int GENERATED BY DEFAULT AS IDENTITY '
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
      let msg =   isDisabled.value ? '修改表成功' : '新建表成功'
      ElMessage.success(msg)
      treeStore.triggerRefresh()
    }
    else {
      ElMessage.error('失败:' + res.message)
    }

}

function setPrimaryKey(row) {
  // 清除所有
  table.value.fields.forEach(r => { r.ispk = false })
  // 给当前行设置
  row.ispk = true
}
defineExpose({ openDialog })
</script>