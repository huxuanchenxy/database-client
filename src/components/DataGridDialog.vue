<!-- DataGridDialog.vue -->
<template>
  <el-dialog
    title="点位表"
    :model-value="visible"
    width="90%"
    :style="{ height: '75vh' }"
    top="5vh"
    :close-on-click-modal="false"
    @closed="handleClosed"
    @update:model-value="(v) => $emit('update:visible', v)"
  >
    <!-- 工具栏 -->
    <!-- <div style="margin-bottom: 8px">
      <el-button type="primary" size="mini" @click="handleAdd">新增</el-button>
      <el-button type="success" size="mini" @click="loadData">刷新</el-button>
    </div> -->

    <!-- 表格 -->
    <vxe-grid
      ref="xGrid"
      border
      stripe
      keep-source
      highlight-hover-row
      auto-resize
      style="height:500px;"
      size="mini"
      :data="tableData"
      :columns="dynamicColumns"
      :edit-config="{ trigger: 'manual', mode: 'row', showStatus: true, showAsterisk: true }"
      :pager-config="pager"
      @page-change="handlePageChange"
    >
      <!-- 操作列 -->
      <template #action="{ row }">
        <template v-if="!row.__editing">
          <el-button type="primary" size="mini" @click="startEdit(row)">修改</el-button>
          <el-button type="danger" size="mini" @click="startDelete(row)">删除</el-button>
        </template>
        <template v-else>
          <el-button type="success" size="mini" :loading="row.__saving" @click="saveRow(row)">保存</el-button>
          <el-button size="mini" @click="cancelEdit(row)">取消</el-button>
        </template>
      </template>
    </vxe-grid>
  </el-dialog>
</template>

<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { databaseApi } from '@/api/api'
import { useConnStore } from '@/stores/conn'
const connStore = useConnStore()
/* ----------------- props & emit ----------------- */
const props = defineProps({
  visible: { type: Boolean, default: false }   // v-model:visible
  ,extra: Object
})


const emit = defineEmits(['update:visible'])

/* ----------------- 表格相关 ----------------- */
const xGrid = ref(null)
const loading = ref(false)
const tableData = ref([])          // 当前页行数据
const dynamicColumns = ref([])     // 动态列
const pager = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50, 100],
  layouts: [ 'PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'Total']
})

/* ----------------- 生命周期 ----------------- */
watch(() => props.visible, async (v) => v && loadData())


function detectEditRender(key, list) {
  if (!list.length) return { name: 'input', attrs: { placeholder: '请输入' } }

  // 拿第一行非空值做样本
  const val = list[0][key]
  if (val === null || val === undefined || val === '') {
    return { name: 'input', attrs: { placeholder: '请输入' } }
  }

  // 1. 纯数字（支持小数、负数）
  if (/^-?\d+(\.\d+)?$/.test(String(val))) {
    return {
      name: '$input',
      attrs: { type: 'number', placeholder: '请输入数字' }
    }
  }

  // 2. 日期时间  yyyy-MM-dd HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(val))) {
    return {
      name: 'ElDatePicker',
      props: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' },
      immediate: true
    }
  }

  // 3. 日期  yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) {
    return {
      name: '$input',
      attrs: { type: 'date', placeholder: '选择日期' }
    }
  }

  // 4. 默认文本
  return { name: 'input', attrs: { placeholder: '请输入' } }
}
// 根据行数据推导列配置
// function buildColumns(list,columns) {
//   const cols = []
//   if (!list.length) return cols
//   const keys = columns
//   keys.forEach((key) => {
//     cols.push({
//       field: key,
//       title: key,
//       minWidth: 120,
//       editRender: { name: 'input', attrs: { placeholder: '请输入' } }
//     })
//   })
//   // 操作列
//   cols.push({
//     title: '操作',
//     width: 160,
//     fixed: 'right',
//     slots: { default: 'action' }
//   })
//   return cols
// }

function buildColumns(list, columns) {
  const cols = []
  if (!list.length) return cols

  columns.forEach(key => {
    const editRender = detectEditRender(key, list)
    // console.log('editRender',editRender)
    cols.push({
      field: key,
      title: key,
      minWidth: 120,
      editRender
    })
  })

  // 操作列
  cols.push({
    title: '操作',
    width: 160,
    fixed: 'right',
    slots: { default: 'action' }
  })
  return cols
}

/* ----------------- 数据加载 ----------------- */
async function loadData() {
  loading.value = true
  tableData.value = []
  dynamicColumns.value = []
  pager.total = 0
  let cfgstr = props.extra.data.id
  let cfgid = Number(cfgstr.replace('cfg_', ''))
  const parm = { ...connStore.conn, oprationInt: cfgid,lsInt:[pager.currentPage,pager.pageSize] }
  const res = await databaseApi.getdatavalue(parm)
  console.log('loadData res',res)
  if(res.code === 200 && res.data && res.data.list && res.data.list.length > 0)
  {
    // const total = 111
    // const page = pager.currentPage
    // const size = pager.pageSize
    // const start = (page - 1) * size + 1
    tableData.value = res.data.list
    dynamicColumns.value = buildColumns(res.data.list,res.data.columns)
    pager.total = res.data.rowCount
    loading.value = false
  }
}

function handlePageChange({ currentPage, pageSize }) {
  pager.currentPage = currentPage
  pager.pageSize = pageSize
  loadData()
}

/* ----------------- 行编辑 ----------------- */
function startEdit(row) {
  const $grid = xGrid.value
  $grid.clearEdit()
  row.__editing = true
  $grid.setEditRow(row)
}

function cancelEdit(row) {
  const $grid = xGrid.value
  $grid.clearEdit()
  row.__editing = false
  // 还原数据
  const source = $grid.getEditRecord(row)
  source && Object.assign(row, source)
}

async function saveRow(row) {
  const $grid = xGrid.value

  // ⚠️ 这行很关键，强制把输入框里的值同步到 row
  await $grid.fullValidate().catch(() => {})

  const editRecord = $grid.getEditRecord(row)
  if (!editRecord) {
    ElMessage.error('未获取到编辑数据')
    return
  }

  const newData = JSON.parse(JSON.stringify(editRecord.row)) // 此时就是最新值
  // console.log('✅ newData', newData)

    // ✅ 手动转换数字字段
  dynamicColumns.value.forEach(col => {
    const field = col.field
    const render = col.editRender
    if (
      render &&
      render.name === '$input' &&
      render.attrs &&
      render.attrs.type === 'number'
    ) {
      if (newData[field] !== null && newData[field] !== undefined && newData[field] !== '') {
        newData[field] = Number(newData[field])
      }
    }
  })

  console.log('✅ 转换后的 newData', newData)
  row.__saving = true
  try {
    const parm = { ...connStore.conn, oprationInt: 1, mpJson: newData }
    // console.log('execdatavalue parm', parm)
    const res = await databaseApi.execdatavalue(parm)
    if (res.code === 200) {
      Object.assign(row, newData)
      $grid.clearEdit()
      row.__editing = false
      ElMessage.success('保存成功')
      loadData()
    } else {
      ElMessage.error(JSON.stringify(res))
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    row.__saving = false
  }
}



/* ----------------- 行删除 ----------------- */
function startDelete(row) {
  ElMessageBox.confirm('确定删除？', '提示').then(async () => {
    const parm = { ...connStore.conn, oprationInt: 0, mpJson:row}
    const res = await databaseApi.execdatavalue(parm)
    row.__editing = false
    if(res.code === 200)
    {
      // 1. 让 grid 退出编辑并还原缓存
      const $grid = xGrid.value
      $grid.clearEdit()          // 退出编辑
      $grid.revertData(row)      // 用最新数据刷新缓存

      // 2. 再改自己的状态位
      row.__editing = false
      row.__saving = false

      // 3. 刷新当前行（可选，保证数据一致性）
      $grid.reloadRow(row)
      ElMessage.success('删除成功')
      loadData()
    }else
    {
        ElMessage.error(JSON.stringify(res))
    }
    
    
  }).catch(() => {})
}

/* ----------------- 新增 ----------------- */
function handleAdd() {
  // 预留：打开子表单或直接在表格插入一行
  ElMessage.info('请调用新增接口/弹窗')
}

/* ----------------- 关闭 ----------------- */
function handleClosed() {
  // 清理状态
  xGrid.value && xGrid.value.clearAll()
}


defineExpose({ loadData})
</script>

<style scoped>
/* 如有需要可自行覆盖 */
</style>