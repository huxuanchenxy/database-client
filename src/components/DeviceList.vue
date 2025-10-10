<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>设备管理</span>
        <el-button type="primary" @click="openAdd">新增设备</el-button>
      </div>
    </template>
    <div class="table-wrapper">
      <el-table :data="deviceList" stripe style="width: 100%">
        <el-table-column type="index" width="60" label="序号" />
        <el-table-column prop="device_name" label="设备名称" />
        <el-table-column prop="protocol_type" label="协议" />
        <el-table-column prop="slave_id" label="从站地址" />
        <el-table-column prop="ip_address" label="IP地址" />
        <el-table-column prop="tcp_port" label="端口" width="80" />
        <el-table-column prop="serial_port" label="串口号" />
        <el-table-column prop="baud_rate" label="波特率" />
        <el-table-column prop="data_bits" label="数据位" />
        <el-table-column prop="stop_bits" label="停止位" />
        <el-table-column prop="parity" label="校验位" />
        <el-table-column prop="timeout_m" label="超时" />
        <el-table-column prop="retry_count" label="重试次数" />
        <el-table-column prop="is_active" label="是否激活" />
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column prop="updated_at" label="最后通信时间" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusColorMap[row.comm_status].type">
              {{ statusColorMap[row.comm_status].text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <!-- <el-button
              link
              :type="btnMap[row.comm_status].type"
              @click="toggleConnect(row)"
            >
              {{ btnMap[row.comm_status].text }}
            </el-button> -->
            <el-button link type="primary" @click="openEdit(row)"
              >配置</el-button
            >
            <el-popconfirm title="确定删除吗？" @confirm="delDevice(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>

  <!-- 新增/编辑弹窗 -->
  <DeviceEdit v-model="showEdit" :row="currentRow" @refresh="loadList" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import DeviceEdit from "./DeviceEdit.vue";
import { ElMessage } from "element-plus";
import { databaseApi } from "@/api/api.js";
import { useConnStore } from "@/stores/conn";
import { useTreeStore } from "@/stores/treeStore";
const treeStore = useTreeStore();
const connStore = useConnStore();
const deviceList = ref([]);
const showEdit = ref(false);
const currentRow = ref(null);

// 模拟数据，实际换成接口
async function loadList() {
  if (!connStore.conn) return;
  const res = await databaseApi.getdevicelist(connStore.conn);
  // console.log('res',res)
  if (res.code === 200) {
    deviceList.value = res.data;
  }
}

function openAdd() {
  currentRow.value = null;
  showEdit.value = true;
}
function openEdit(row) {
  currentRow.value = row;
  showEdit.value = true;
}

function handleOk() {
  loadList();
}

async function delDevice(id) {
  // deviceList.value = deviceList.value.filter(item => item.id !== id)
  // ElMessage.success('删除成功')
  // console.log('id',id)
  try {
    const parm = { ...connStore.conn, oprationInt: id };
    const res = await databaseApi.deldevice(parm);
    if (res.code === 200) {
      ElMessage.success("删除成功");
      handleOk();
      treeStore.triggerRefresh();
    } else {
      ElMessage.error(res.message);
    }
  } catch (e) {
    ElMessage.error("删除失败");
  }
}
function toggleConnect(row) {
  row.status = row.status === "已连接" ? "已断开" : "已连接";
  ElMessage.success("操作成功");
}

onMounted(() => {
  loadList();
});

// 颜色映射：success / danger / warning / info / primary 任选
const statusColorMap = {
  OK: { type: "success", text: "成功" },
  ERROR: { type: "danger", text: "错误" },
  TIMEOUT: { type: "warning", text: "超时" },
  DISCONNECTED: { type: "info", text: "断开" },
};

/* ------- 状态 → 按钮配置 ------- */
const btnMap = {
  OK: { type: "danger", text: "断开" },
  ERROR: { type: "warning", text: "重连" },
  TIMEOUT: { type: "warning", text: "重连" },
  DISCONNECTED: { type: "primary", text: "连接" },
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-wrapper {
  width: 100%;
  height:70vh;
  overflow: auto; /* 窗口缩小时出现滚动条 */
}
</style>
