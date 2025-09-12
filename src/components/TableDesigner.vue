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
      :model-value="sqlPreview"
      readonly
    />

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
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
const openDialog = async (initial = null) => {
    
  if (initial) {
    isDisabled.value = true
    let res = await databaseApi.getTableInfo({
      ...connStore.conn,
      oprationString: initial
    })
    console.log('初始数据：', res)
    // table.value = JSON.parse(JSON.stringify(initial))
    table.value.fields = []
    table.value.name = initial
    if(res.code === 200)
    {
        table.value.fields = res.data.fields.map(f => {
            const { type, length } = parseDataType(f.data_type)
            return { ...f, type, length }   // 新增两个字段
        })
    }
  } else {
    isDisabled.value = false
    table.value = {
      name: '',
      comment: '',
      fields: []
    }
    // addField()
  }
  visible.value = true
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
  if (comment) sql += `\nALTER TABLE ${name} COMMENT='${comment}';`  // ← 同样去掉
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