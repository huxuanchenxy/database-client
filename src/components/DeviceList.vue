<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>设备管理</span>
        <el-button type="primary" @click="openAdd">新增设备</el-button>
      </div>
    </template>

    <el-table :data="deviceList" stripe style="width: 100%">
      <el-table-column prop="id" label="序号" width="60" />
      <el-table-column prop="name" label="设备名称" />
      <el-table-column prop="ip" label="IP地址" />
      <el-table-column prop="port" label="端口" width="80" />
      <el-table-column prop="rack" label="机架号" width="100" />
      <el-table-column prop="lastTime" label="最后通信时间" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '已连接' ? 'success' : 'danger'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            link
            :type="row.status === '已连接' ? 'danger' : 'primary'"
            @click="toggleConnect(row)"
          >
            {{ row.status === '已连接' ? '断开' : '连接' }}
          </el-button>
          <el-button link type="primary" @click="openEdit(row)">配置</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="delDevice(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 新增/编辑弹窗 -->
  <DeviceEdit
    v-model="showEdit"
    :row="currentRow"
    @refresh="loadList"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DeviceEdit from './DeviceEdit.vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const deviceList = ref([])
const showEdit = ref(false)
const currentRow = ref(null)

// 模拟数据，实际换成接口
function loadList() {
  deviceList.value = [
    { id: 1, name: '设备A', ip: '192.168.1.10', port: 8080, rack: '1号', lastTime: '2025-09-19 10:00:00', status: '已断开' },
    { id: 2, name: '设备B', ip: '192.168.1.11', port: 8080, rack: '2号', lastTime: '2025-09-19 10:05:00', status: '已连接' },
    { id: 3, name: '设备C', ip: '192.168.1.12', port: 8080, rack: '3号', lastTime: '', status: '连接中' }
  ]
}

function openAdd() {
  currentRow.value = null
  showEdit.value = true
}
function openEdit(row) {
  currentRow.value = row
  showEdit.value = true
}
function delDevice(id) {
  deviceList.value = deviceList.value.filter(item => item.id !== id)
  ElMessage.success('删除成功')
}
function toggleConnect(row) {
  row.status = row.status === '已连接' ? '已断开' : '已连接'
  ElMessage.success('操作成功')
}

onMounted(loadList)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>