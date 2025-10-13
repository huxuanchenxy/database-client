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
    <div style="margin-bottom: 8px">
      <el-button type="primary" size="mini" @click="handleAdd">新增</el-button>
      <el-button type="success" size="mini" @click="loadData">刷新</el-button>
    </div>

    <!-- 表格 -->
    <vxe-grid
      ref="xGrid"
      v-loading="loading"
      border
      stripe
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
  layouts: ['Sizes', 'PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'FullJump', 'Total']
})

/* ----------------- 生命周期 ----------------- */
watch(() => props.visible, async (v) => v && loadData())


// 根据行数据推导列配置
function buildColumns(list,columns) {
  const cols = []
  if (!list.length) return cols
  const keys = columns
  keys.forEach((key) => {
    cols.push({
      field: key,
      title: key,
      minWidth: 120,
      editRender: { name: 'input', attrs: { placeholder: '请输入' } }
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
  // await nextTick()
  console.log('extra',props.extra)
  let cfgstr = props.extra.data.id
  let cfgid = Number(cfgstr.replace('cfg_', ''))
  const parm = { ...connStore.conn, oprationInt: cfgid }
  const res = await databaseApi.getdatavalue(parm)
  console.log('res',res)
  if(res.code === 200 && res.data && res.data.list && res.data.list.length > 0)
  {
    // const total = 111
    // const page = pager.currentPage
    // const size = pager.pageSize
    // const start = (page - 1) * size + 1
    tableData.value = res.data.list
    dynamicColumns.value = buildColumns(res.data.list,res.data.columns)
    // pager.total = total
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
  row.__saving = true
  // 预留：真正保存接口
  try {
    await fakeSaveApi(row)
    row.__editing = false
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    row.__saving = false
  }
}

/* ----------------- 行删除 ----------------- */
function startDelete(row) {
  ElMessageBox.confirm('确定删除？', '提示').then(async () => {
    await fakeDeleteApi(row)
    ElMessage.success('删除成功')
    loadData()
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

/* ----------------- 预留接口 ----------------- */
function fakeSaveApi(row) {
  return new Promise((resolve) => setTimeout(resolve, 300))
}
function fakeDeleteApi(row) {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

defineExpose({ loadData})
</script>

<style scoped>
/* 如有需要可自行覆盖 */
</style>