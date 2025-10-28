<!-- DeviceEdit.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="isAdd ? '新增设备' : '编辑设备'"
    width="760px"
    :style="{ 'margin':'2vh auto' }"
    @close="handleClose"
    @opened="onDialogOpened"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="dynamicRules"
      label-width="110px"
    >
      <el-card>
        <template #header>
          <div class="card-header">
            <span>设备通信参数</span>
          </div>
        </template>
        <!-- 基础公共字段 -->
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="form.device_name" placeholder="请输入设备名称" />
        </el-form-item>

        <el-form-item label="协议类型" prop="protocol_type">
          <el-select v-model="form.protocol_type" @change="onProtocolChange">
            <el-option label="MODBUS_TCP" value="MODBUS_TCP" />
            <el-option label="MODBUS_RTU" value="MODBUS_RTU" />
          </el-select>
        </el-form-item>

        <el-form-item label="超时时间(ms)" prop="timeout_ms">
          <el-input-number
            v-model="form.timeout_ms"
            :min="100"
            :max="60000"
            step="100"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="重试次数" prop="retry_count">
          <el-input-number
            v-model="form.retry_count"
            :min="0"
            :max="10"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="启用状态" prop="is_active">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
            :before-change="beforeActiveChange"
          />
        </el-form-item>

        <!-- TCP 字段组 -->
        <template v-if="form.protocol_type === 'MODBUS_TCP'">
          <el-form-item label="从站地址" prop="slave_id">
            <el-input-number
              v-model="form.slave_id"
              :min="1"
              :max="247"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="IP地址" prop="ip_address">
            <el-input
              v-model="form.ip_address"
              placeholder="例：192.168.1.100"
            />
          </el-form-item>

          <el-form-item label="TCP端口" prop="tcp_port">
            <el-input-number
              v-model="form.tcp_port"
              :min="1"
              :max="65535"
              controls-position="right"
            />
          </el-form-item>
        </template>

        <!-- RTU 字段组 -->
        <template v-if="form.protocol_type === 'MODBUS_RTU'">
          <el-form-item label="串口号" prop="serial_port">
            <el-input v-model="form.serial_port" placeholder="例：COM1" />
          </el-form-item>

          <el-form-item label="波特率" prop="baud_rate">
            <el-select v-model="form.baud_rate">
              <el-option label="9600" :value="9600" />
              <el-option label="19200" :value="19200" />
              <el-option label="38400" :value="38400" />
              <el-option label="115200" :value="115200" />
            </el-select>
          </el-form-item>

          <el-form-item label="数据位" prop="data_bits">
            <el-select v-model="form.data_bits">
              <el-option label="8" :value="8" />
              <el-option label="7" :value="7" />
            </el-select>
          </el-form-item>

          <el-form-item label="停止位" prop="stop_bits">
            <el-select v-model="form.stop_bits">
              <el-option label="1" :value="1" />
              <el-option label="2" :value="2" />
            </el-select>
          </el-form-item>

          <el-form-item label="校验位" prop="parity">
            <el-select v-model="form.parity">
              <el-option label="无(N)" value="N" />
              <el-option label="奇(O)" value="O" />
              <el-option label="偶(E)" value="E" />
            </el-select>
          </el-form-item>
        </template>
      </el-card>
      <el-card class="card2">
        <template #header>
          <div class="card-header">
            <span>设备点位管理</span>
          </div>
        </template>
          <div class="page">
            <!-- 顶部按钮 -->
            <div class="toolbar">
              <el-button type="primary" @click="handleAdd">新增点位</el-button>
            </div>

            <!-- 表格 -->
            <el-table
              :data="tableData"
              v-loading="loading"
              border
              stripe
              style="width: 100%"
              height="200"
            >

            <!-- 1. 固定左侧：ID -->
            <el-table-column
              prop="id"
              label="ID"
              width="70"
              fixed="left"
              show-overflow-tooltip
            />

            <!-- 2. 固定左侧：点位名称 -->
            <el-table-column
              prop="point_name"
              label="点位名称"
              min-width="140"
              fixed="left"
              show-overflow-tooltip
            />
              <!-- 需要横向滚动的大部分列 -->
              <el-table-column
                v-for="col in columns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
                :min-width="col.minWidth"
                show-overflow-tooltip
              />

              <!-- 固定右侧操作列 -->
              <el-table-column
                label="操作"
                fixed="right"
                width="160"
                align="center"
              >
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleEdit(row)"
                    >修改</el-button
                  >
                  <el-popconfirm
                    title="确定删除该点位吗？"
                    @confirm="handleDelete(row)"
                  >
                    <template #reference>
                      <el-button link type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>

            <!-- 新增 / 修改弹窗 -->
            <el-dialog
              v-model="dialogVisible"
              :title="isAdd2 ? '新增设备点位' : '修改设备点位'"
              width="640px"
              top="6vh"
              :close-on-click-modal="false"
              @closed="resetform2"
            >
              <el-form
                ref="formRef2"
                :model="form2"
                :rules="rules"
                label-width="110px"
                scroll-to-error
              >
                <!-- 设备名称：仅读 -->
                <el-form-item label="设备名称">
                  <el-input :model-value="form.device_name" disabled />
                </el-form-item>

                <el-form-item label="点位名称" prop="point_name">
                  <el-input
                    v-model="form2.point_name"
                    placeholder="请输入点位名称"
                  />
                </el-form-item>

                <el-form-item label="功能描述" prop="description">
                  <el-input
                    v-model="form2.description"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入功能描述"
                  />
                </el-form-item>

                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="寄存器地址" prop="register_address">
                      <el-input-number
                        v-model="form2.register_address"
                        :min="0"
                        :precision="0"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="寄存器数量" prop="register_count">
                      <el-input-number
                        v-model="form2.register_count"
                        :min="1"
                        :precision="0"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="功能码" prop="function_code">
                      <el-input-number
                        v-model="form2.function_code"
                        :min="1"
                        :max="255"
                        :precision="0"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="数据类型" prop="data_type">
                      <el-select v-model="form2.data_type" style="width: 100%">
                        <el-option
                          v-for="t in dataTypeOptions"
                          :key="t"
                          :label="t"
                          :value="t"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="字节序" prop="byte_order">
                  <el-select v-model="form2.byte_order" style="width: 100%">
                    <el-option
                      v-for="b in byteOrderOptions"
                      :key="b"
                      :label="b"
                      :value="b"
                    />
                  </el-select>
                </el-form-item>

                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="缩放因子" prop="scaling_factor">
                      <el-input-number
                        v-model="form2.scaling_factor"
                        :min="0"
                        :precision="4"
                        :step="0.1"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="偏移量" prop="offset_value">
                      <el-input-number
                        v-model="form2.offset_value"
                        :precision="4"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="单位" prop="unit">
                      <el-input
                        v-model="form2.unit"
                        placeholder="如：°C、MPa"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <!-- <el-form-item label="轮询间隔(ms)" prop="poll_interval_ms">
                      <el-input-number
                        v-model="form2.poll_interval_ms"
                        :min="100"
                        :step="100"
                        :precision="0"
                        controls-position="right"
                        style="width: 100%"
                      />
                    </el-form-item> -->
                  </el-col>
                </el-row>

                <!-- <el-form-item label="是否启用" prop="is_active">
                  <el-switch v-model="form2.is_active" />
                </el-form-item> -->
              </el-form>

              <template #footer>
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button
                  type="primary"
                  :loading="saveLoading"
                  @click="handleSave"
                  >确 定</el-button
                >
              </template>
            </el-dialog>
          </div>
      </el-card>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        保 存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { databaseApi } from "@/api/api";
import { useConnStore } from "@/stores/conn";
import { useTreeStore } from "@/stores/treeStore";
const treeStore = useTreeStore();
const connStore = useConnStore();
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  row: { type: Object, default: () => null },
});
const emit = defineEmits(["update:modelValue", "refresh"]);

/* 弹窗显隐 */
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

/* 表单 */
const formRef = ref();
const defaultForm = () => ({
  id: undefined,
  device_name: "",
  protocol_type: "MODBUS_TCP",
  slave_id: 1,
  ip_address: "",
  tcp_port: 502,
  serial_port: "",
  baud_rate: 9600,
  data_bits: 8,
  stop_bits: 1,
  parity: "N",
  /* 新增公共字段 */
  timeout_ms: 1500,
  retry_count: 3,
  is_active: true,
});
const form = ref(defaultForm());
const isAdd = computed(() => !props.row);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      nextTick(() => formRef.value?.clearValidate());
      form.value = props.row
        ? { ...defaultForm(), ...props.row }
        : defaultForm();

        // console.log('form.value',form.value);
    }
  }
);

/* 动态校验规则 */
const createRules = () => ({
  device_name: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
  protocol_type: [
    { required: true, message: "请选择协议类型", trigger: "change" },
  ],
  slave_id: [
    {
      required: true,
      type: "number",
      message: "请输入从站地址",
      trigger: "blur",
    },
  ],
  ip_address: [
    { required: true, message: "请输入IP地址", trigger: "blur" },
    {
      pattern:
        /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/,
      message: "IP格式错误",
      trigger: "blur",
    },
  ],
  tcp_port: [
    {
      required: true,
      type: "number",
      min: 1,
      max: 65535,
      message: "端口范围 1-65535",
      trigger: "blur",
    },
  ],
  serial_port: [{ required: true, message: "请输入串口号", trigger: "blur" }],
  baud_rate: [
    {
      required: true,
      type: "number",
      message: "请选择波特率",
      trigger: "change",
    },
  ],
  data_bits: [
    {
      required: true,
      type: "number",
      message: "请选择数据位",
      trigger: "change",
    },
  ],
  stop_bits: [
    {
      required: true,
      type: "number",
      message: "请选择停止位",
      trigger: "change",
    },
  ],
  parity: [{ required: true, message: "请选择校验位", trigger: "change" }],
  /* 新增公共字段校验 */
  timeout_ms: [
    {
      required: true,
      type: "number",
      min: 100,
      max: 60000,
      message: "超时范围 100-60000 ms",
      trigger: "blur",
    },
  ],
  retry_count: [
    {
      required: true,
      type: "number",
      min: 0,
      max: 10,
      message: "重试范围 0-10",
      trigger: "blur",
    },
  ],
  is_active: [{ required: true, type: "boolean", trigger: "change" }],
});
const allRules = ref(createRules());

const dynamicRules = computed(() => {
  const base = {
    device_name: allRules.value.device_name,
    protocol_type: allRules.value.protocol_type,
    timeout_ms: allRules.value.timeout_ms,
    retry_count: allRules.value.retry_count,
    is_active: allRules.value.is_active,
  };
  if (form.value.protocol_type === "MODBUS_TCP") {
    Object.assign(base, {
      slave_id: allRules.value.slave_id,
      ip_address: allRules.value.ip_address,
      tcp_port: allRules.value.tcp_port,
    });
  } else {
    Object.assign(base, {
      serial_port: allRules.value.serial_port,
      baud_rate: allRules.value.baud_rate,
      data_bits: allRules.value.data_bits,
      stop_bits: allRules.value.stop_bits,
      parity: allRules.value.parity,
    });
  }
  return base;
});

function onProtocolChange() {
  nextTick(() => formRef.value?.clearValidate());
}

/* 提交 */
const submitLoading = ref(false);
async function handleSubmit() {
  await formRef.value.validate();
  submitLoading.value = true;
  try {
    // const api = isAdd.value ? addDevice : updateDevice
    // await api(form.value)
    // console.log('form',form.value)
    // console.log('isAdd',isAdd)
    let devices = {
      id: isAdd.value ? 0 : form.value.id,
      device_name: form.value.device_name,
      protocol_type: form.value.protocol_type,
      slave_id: form.value.slave_id,
      ip_address: form.value.ip_address,
      tcp_port: form.value.tcp_port,
      serial_port: form.value.serial_port,
      baud_rate: form.value.baud_rate,
      data_bits: form.value.data_bits,
      stop_bits: form.value.stop_bits,
      parity: form.value.parity,
      timeout_ms: form.value.timeout_ms,
      retry_count: form.value.retry_count,
      is_active: form.value.is_active,
    };
    const parm = { ...connStore.conn, devices: devices };
    const res = await databaseApi.execdevice(parm);
    if (res.code === 200) {

      // console.log('res device',res)
      if(tableData.value && tableData.value.length > 0)
      {
          tableData.value = tableData.value.map(item => ({ ...item, device_id: res.data })) //后端会返给我的设备id
          const parm2 = { ...connStore.conn, registers: tableData.value }
          const res2 = await databaseApi.execregister(parm2)
          if(res2.code !== 200)
          {
            ElMessage.success("提交点位失败");
          }
      }
      ElMessage.success(isAdd.value ? "新增成功" : "修改成功");
      handleClose();
      emit("refresh");
      treeStore.triggerRefresh();
    } else {
      ElMessage.error(JSON.stringify(res));
    }
  }catch(e){
    ElMessage.error("提交失败"+e);
  } finally {
    submitLoading.value = false;
  }
}

function handleClose() {
  visible.value = false;
}

//点位配置
/* --------------------- 静态数据 --------------------- */
const deviceId = 1; // 当前设备 id，根据实际路由或父组件传入自行调整

const dataTypeOptions = [
  "BOOL",
  "INT16",
  "UINT16",
  "INT32",
  "UINT32",
  "FLOAT32",
  "FLOAT64",
];
const byteOrderOptions = [
  "BIG_ENDIAN",
  "LITTLE_ENDIAN",
  "BIG_ENDIAN_BYTE_SWAP",
  "LITTLE_ENDIAN_BYTE_SWAP",
];

/* --------------------- 表格 --------------------- */
const loading = ref(false);
const tableData = ref([]);

// 列配置（想加/minWidth 自己调）
const columns = [
  // { prop: "id", label: "ID", width: 70 },
  // { prop: "point_name", label: "点位名称", minWidth: 140 },
  { prop: "description", label: "描述", minWidth: 160 },
  { prop: "register_address", label: "寄存器地址", width: 110 },
  { prop: "register_count", label: "寄存器数量", width: 110 },
  { prop: "function_code", label: "功能码", width: 90 },
  { prop: "data_type", label: "数据类型", width: 110 },
  { prop: "byte_order", label: "字节序", width: 150 },
  { prop: "scaling_factor", label: "缩放因子", width: 100 },
  { prop: "offset_value", label: "偏移量", width: 90 },
  { prop: "unit", label: "单位", width: 70 },
 // { prop: "poll_interval_ms", label: "轮询间隔(ms)", width: 130 },
  // {
  //   prop: "is_active",
  //   label: "启用",
  //   width: 70,
  //   formatter: (row) => (row.is_active ? "是" : "否"),
  // },
];

/* --------------------- 弹窗表单 --------------------- */
const dialogVisible = ref(false);
const saveLoading = ref(false);
const isAdd2 = ref(true); // true 新增  false 修改
const formRef2 = ref(null);

// 空模板
const initForm = () => ({
  id: 0, // 0 新增  非0 修改
  device_id: deviceId,
  point_name: "",
  description: "",
  register_address: 40001,
  register_count: 1,
  function_code: 3,
  data_type: "FLOAT32",
  byte_order: "BIG_ENDIAN",
  scaling_factor: 1,
  offset_value: 0,
  unit: "",
  poll_interval_ms: 1000,
  is_active: true,
});

const form2 = reactive(initForm());


/* --------------------- 计算属性：已占用的寄存器地址 --------------------- */
const usedRegisterAddrs = computed(() => {
  // 如果是“修改”状态，需要把自己这条记录排除掉，否则保存时会误判
  const skipId = isAdd2.value ? -1 : form2.id;
  return tableData.value
    .filter(item => item.id !== skipId)
    .map(item => Number(item.register_address));
});

/* --------------------- 校验器：寄存器地址不能重复 --------------------- */
const validateUniqueAddr = (rule, value, callback) => {
  if (value == null) return callback();          // 非空校验交给原规则
  if (usedRegisterAddrs.value.includes(Number(value))) {
    return callback(new Error('寄存器地址已存在，请重新输入'));
  }
  callback();
};

const rules = {
  point_name: [{ required: true, message: "请输入点位名称", trigger: "blur" }],
  register_address: [
    { required: true, message: "请输入寄存器地址", trigger: "blur" },
    { validator: validateUniqueAddr, trigger: ['blur', 'change'] },
  ],
  register_count: [
    { required: true, message: "请输入寄存器数量", trigger: "blur" },
  ],
  function_code: [{ required: true, message: "请输入功能码", trigger: "blur" }],
  data_type: [{ required: true, message: "请选择数据类型", trigger: "change" }],
  byte_order: [{ required: true, message: "请选择字节序", trigger: "change" }],
  scaling_factor: [
    { required: true, message: "请输入缩放因子", trigger: "blur" },
  ],
  poll_interval_ms: [
    { required: true, message: "请输入轮询间隔", trigger: "blur" },
  ],
};

/* --------------------- API 相关 --------------------- */
// 查询列表
const fetchList = async () => {
  if (!connStore.conn.dbHost) return
  loading.value = true;
  try {
    // TODO: 替换成你的真实接口
    let deviceid = 0
    deviceid = form.value.id
    // console.log('form.value',form.value)
    const parm = { ...connStore.conn, oprationInt: deviceid }
    const res = await databaseApi.getregister(parm)
    // console.log('点位列表：',res)
    if (res.code === 200) {
      tableData.value = res.data
    } else {
      ElMessage.error(JSON.stringify(res))
    }
  } catch (e) {
    // ElMessage.error("获取列表失败");
    console.log('DeviceEdit',e);
  } finally {
    loading.value = false;
  }
};

// 新增 / 修改提交
// const handleSave = async () => {
//   await formRef2.value.validate();
//   saveLoading.value = true;
//   try {
//     let obj = {
// 		  id:isAdd2.value?0:form2.id,
// 			device_id:form.value.id,
// 			point_name:form2.point_name,
// 			description:form2.description,
// 			register_address:form2.register_address,
// 			register_count:form2.register_count,
// 			function_code:form2.function_code,
// 			data_type:form2.data_type,
// 			byte_order:form2.byte_order,
// 			scaling_factor:form2.scaling_factor,
// 			offset_value:form2.offset_value,
// 			unit:form2.unit,
//       poll_interval_ms:form2.poll_interval_ms,
// 			is_active:form2.is_active 
// 		 }
//      console.log('点位新增 提交 obj:',obj)
//     const parm = { ...connStore.conn, registers: obj }
//     console.log('点位新增 提交 parm:',parm)
//     const res = await databaseApi.execregister(parm)
//     console.log('点位新增 修改 res:',res)
//     if (res.code === 200) {
//       ElMessage.success(isAdd2.value ? "新增成功" : "修改成功");
//       dialogVisible.value = false;
//       fetchList(); // 刷新
//     } else {
//       ElMessage.error(res.message);
//     }
    
//   } catch (e) {
//     ElMessage.error(isAdd2.value ? "新增失败" : "修改失败");
//   } finally {
//     saveLoading.value = false;
//   }
// };


// 新增 / 修改提交（仅本地同步，不调接口）
const handleSave = async () => {
  await formRef2.value.validate();   // 仍然先做校验
  saveLoading.value = true;

  try {
    if (isAdd2.value) {
      /* ------- 新增 ------- */
      const newRow = {
        ...form2,
        id: 0, // 临时唯一 id（时间戳）
        device_id: form.value.id,
      };
      tableData.value.push(newRow);
      // ElMessage.success('新增成功');
    } else {
      /* ------- 修改 ------- */
      const idx = tableData.value.findIndex(r => r.id === form2.id);
      if (idx !== -1) {
        // 整体覆盖，保持响应式
        tableData.value[idx] = { ...form2, device_id: form.value.id };
        // 触发 Vue 重新渲染
        tableData.value = [...tableData.value];
        // ElMessage.success('修改成功');
      }
    }

    dialogVisible.value = false;   // 关闭弹窗
  } finally {
    saveLoading.value = false;
  }
};

// 删除
const handleDelete = async (row) => {
  try {

    const idx = tableData.value.findIndex(r => r.id === row.id);
    if (idx !== -1) {
      tableData.value.splice(idx, 1);
    }
    if(row.id != 0)
    {
        const parm = { ...connStore.conn, oprationInt: row.id }
        const res = await databaseApi.delregister(parm)
        if(res.code === 200)
        {
          ElMessage.success("删除成功");
          fetchList();
        }else
        {
            ElMessage.error(JSON.stringify(res))
        }
    }
  } catch (e) {
    ElMessage.error("删除失败");
  }
};

/* --------------------- 事件 --------------------- */
const handleAdd = () => {
  isAdd2.value = true;
  Object.assign(form2, initForm());
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isAdd2.value = false;
  // 深拷贝一下，避免直接改表格
  console.log('点位编辑 提交 row:',row)
  Object.assign(form2, JSON.parse(JSON.stringify(row)));
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef2.value?.resetFields();
  Object.assign(form2, initForm());
};

/* --------------------- 初始化 --------------------- */
onMounted(() => {
  fetchList();
});

function onDialogOpened() {
  fetchList()
  fetchRunningList()
}

const runningDeviceIds = ref(new Set())
async function fetchRunningList() {
  try {
    // 这里调你自己的接口，只要能返回 status=1 的记录即可
    const res = await databaseApi.getallconfiginfotj(connStore.conn) // <= 换成真实接口
    if (res.code === 200 && Array.isArray(res.data)) {
      runningDeviceIds.value = new Set(
        res.data.filter(i => i.status === 1).map(i => i.deviceid)
      )
    }
  } catch (e) {
    console.error('获取运行中的配置失败', e)
  }
}
async function beforeActiveChange(newVal) {
  // newVal = false 表示用户想“关闭”
  console.log('beforeActiveChange',form.value.is_active)
  if (form.value.is_active && runningDeviceIds.value.has(form.value.id)) {
    ElMessage.warning('该设备已被存储管理占用，不允许禁用！')
    return false // 拦截
  }
  return true // 放行
}
</script>

<style scoped>
:deep(.el-card__header) {
  padding: 4px 4px;
}

.page {
  padding: 10px;
  background: #fff;
}
.toolbar {
  margin-bottom: 3px;
  margin-top: 0px;
}
/* 固定操作列右侧阴影 */
:deep(.el-table__fixed-right) {
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.06);
}

.card2 :deep(.el-card__body) {
  margin-top: -20px;   /* 想移多少就改多少 */
}
</style>
