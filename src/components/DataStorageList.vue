<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>数据存储配置</span>
        <el-button type="primary" @click="openAdd">新增配置</el-button>
      </div>
    </template>

    <!-- ================= 主列表 ================= -->
    <el-table :data="list" stripe style="width: 100%">
      <el-table-column type="index" width="55" label="序号" />
      <el-table-column prop="devicename" label="设备名称" />
      <el-table-column prop="configname" label="存储数据表" />
      <el-table-column prop="ratio" label="数据点" />
      <el-table-column prop="refreshinterval" label="存储间隔(s)" />
      <el-table-column prop="created_at" label="开始时间" />
      <el-table-column prop="updated_at" label="最后执行时间" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status].type">
            {{ statusMap[row.status].text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <!-- <el-button
            link
            :type="row.status === '运行中' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === '运行中' ? '暂停' : '启动' }}
          </el-button> -->
          <el-button link type="primary" @click="openEdit(row)">修改</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="delRow(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <!-- 列表分页 -->
    <!-- <el-pagination
      v-model:current-page="listQuery.page"
      :page-size="listQuery.limit"
      :total="listTotal"
      layout="total, prev, pager, next"
      @current-change="getList"
    /> -->

    <!-- ================= 执行记录 ================= -->
    <el-divider content-position="left">执行记录</el-divider>
    <el-table :data="logList" stripe style="width: 100%">
      <el-table-column prop="id" label="序号" width="60" />
      <el-table-column prop="deviceName" label="设备名称" />
      <el-table-column prop="table" label="目标数据表" />
      <el-table-column prop="point" label="数据点" />
      <el-table-column prop="interval" label="存储间隔" />
      <el-table-column prop="startTime" label="开始执行时间" />
      <el-table-column prop="lastTime" label="最后执行时间" />
      <el-table-column label="详细内容" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewLog(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 日志分页 -->
    <el-pagination
      v-model:current-page="logQuery.page"
      :page-size="logQuery.limit"
      :total="logTotal"
      layout="total, prev, pager, next"
      @current-change="getLog"
    />
  </el-card>

  <!-- 新增 / 编辑弹窗 -->
  <DataStorageEdit
    ref="editRef"
    v-model="showEdit"
    :row="currentRow"
    @refresh="handleOk"
  />
</template>

<script setup>
import { ref, onMounted,nextTick } from 'vue'
import DataStorageEdit from './DataStorageEdit.vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { databaseApi } from '@/api/api'
import { useConnStore } from '@/stores/conn'
import { useTreeStore } from '@/stores/treeStore'
const treeStore = useTreeStore()

const connStore = useConnStore()
/* ========== 列表相关 ========== */
const list = ref([])
const listTotal = ref(0)
const listQuery = ref({ page: 1, limit: 2 })

/* ========== 日志相关 ========== */
const logList = ref([])
const logTotal = ref(0)
const logQuery = ref({ page: 1, limit: 2 })

/* ========== 弹窗相关 ========== */
const showEdit = ref(false)
const currentRow = ref(null)
const editRef = ref(null)

const statusMap = {
  1: { type: 'success',  text: '已启动' },
  0: { type: 'info',  text: '未启动' },
}

/* ----------------------------------------------------
   调接口取列表数据
   GET  /api/storage/list
   参数 : { page, limit }
   返回 : { total, list:[] }
---------------------------------------------------- */
async function getList() {
  try {
    // const { data } = await axios.get('/api/storage/list', { params: listQuery.value })
    const res = await databaseApi.getallconfiginfotj(connStore.conn)
    // console.log('list:',res)
    if(res.code === 200)
    {
        list.value = res.data
    }else
    {
        ElMessage.error(res.message)
    }
    // list.value = data.list
    // list.value = mock
    // listTotal.value = data.total
  } catch (e) {
    ElMessage.error('获取列表失败')
  }
}

/* ----------------------------------------------------
   调接口取执行记录
   GET  /api/storage/log
   参数 : { page, limit }
   返回 : { total, list:[] }
---------------------------------------------------- */
async function getLog() {
  try {
    // const { data } = await axios.get('/api/storage/log', { params: logQuery.value })
let mock = 
    [
    { id: 1, deviceName: 'PLC-A', table: 'plc_data', point: '24/30', interval: '1秒', startTime: '2025-09-19 09:00:00', lastTime: '2025-09-19 10:00:00' },
    { id: 2, deviceName: 'PLC-B', table: 'auto_log', point: '自动', interval: '5秒', startTime: '2025-09-19 09:30:00', lastTime: '2025-09-19 10:05:00' }
  ]

    // logList.value = data.list
    logList.value = mock
    logTotal.value = data.total
  } catch (e) {
    ElMessage.error('获取执行记录失败')
  }
}

/* ----------------------------------------------------
   删除一条配置
   DELETE  /api/storage/:id
---------------------------------------------------- */
async function delRow(row) {
  try {
    console.log('row',row)
    const parm = { ...connStore.conn, oprationInt: row.configid }
    const res = await databaseApi.delconfig(parm)
    if(res.code === 200)
    {
        ElMessage.success('删除成功')
        handleOk()
        treeStore.triggerRefresh()
    }else
    {
        ElMessage.error(res.message)
    }
    
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

/* ----------------------------------------------------
   启动 / 暂停
   PUT  /api/storage/status
   参数 : { id, status }
---------------------------------------------------- */
async function toggleStatus(row) {
  try {
    const newStatus = row.status === '运行中' ? '已暂停' : '运行中'
    await axios.put('/api/storage/status', { id: row.id, status: newStatus })
    ElMessage.success('操作成功')
    getList()   // 重新拉列表
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

/* 新增 / 编辑成功后统一处理：刷新列表、重置分页、刷新日志 */
function handleOk() {
    showEdit.value = false
  getList()
//   getLog()
}

/* 查看日志详情（示例） */
function viewLog(row) {
  ElMessage.info(`查看日志：${row.deviceName} - ${row.table}`)
}

/* 弹窗控制 */
function openAdd() {
  currentRow.value = null
  showEdit.value = true
  nextTick(() => {
    editRef.value.fetchPlcDevices()
  })
  
}
function openEdit(row) {
  currentRow.value = row
  showEdit.value = true
    nextTick(() => {
    editRef.value.fetchPlcDevices()
  })
}

onMounted(() => {
  getList()
//   getLog()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>