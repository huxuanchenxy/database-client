<!-- DeviceEdit.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="isAdd ? '新增设备' : '编辑设备'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="dynamicRules"
      label-width="110px"
    >
      <el-form-item label="设备名称" prop="device_name">
        <el-input v-model="form.device_name" placeholder="请输入设备名称" />
      </el-form-item>

      <el-form-item label="协议类型" prop="protocol_type">
        <el-select v-model="form.protocol_type" @change="onProtocolChange">
          <el-option label="MODBUS_TCP" value="MODBUS_TCP" />
          <el-option label="MODBUS_RTU" value="MODBUS_RTU" />
        </el-select>
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
          <el-input v-model="form.ip_address" placeholder="例：192.168.1.100" />
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
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
// import { addDevice, updateDevice } from '@/api/device' // 换成你的接口
import { databaseApi } from '@/api/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  row: { type: Object, default: () => null } // null=新增
})
const emit = defineEmits(['update:modelValue', 'refresh'])

/* 弹窗显隐 */
const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

/* 表单 */
const formRef = ref()
const defaultForm = () => ({
  id: undefined,
  device_name: '',
  protocol_type: 'MODBUS_TCP',
  slave_id: 1,
  ip_address: '',
  tcp_port: 502,
  serial_port: '',
  baud_rate: 9600,
  data_bits: 8,
  stop_bits: 1,
  parity: 'N'
})
const form = ref(defaultForm())

const isAdd = computed(() => !props.row)

watch(
  () => props.modelValue,
  val => {
    if (val) {
      // 打开时重置表单
      nextTick(() => formRef.value?.clearValidate())
      form.value = props.row ? { ...props.row } : defaultForm()
    }
  }
)

/* 动态校验规则 */
const createRules = () => ({
  device_name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  protocol_type: [
    { required: true, message: '请选择协议类型', trigger: 'change' }
  ],
  slave_id: [
    { required: true, type: 'number', message: '请输入从站地址', trigger: 'blur' }
  ],
  ip_address: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/, message: 'IP格式错误', trigger: 'blur' }
  ],
  tcp_port: [
    { required: true, type: 'number', min: 1, max: 65535, message: '端口范围 1-65535', trigger: 'blur' }
  ],
  serial_port: [
    { required: true, message: '请输入串口号', trigger: 'blur' }
  ],
  baud_rate: [
    { required: true, type: 'number', message: '请选择波特率', trigger: 'change' }
  ],
  data_bits: [
    { required: true, type: 'number', message: '请选择数据位', trigger: 'change' }
  ],
  stop_bits: [
    { required: true, type: 'number', message: '请选择停止位', trigger: 'change' }
  ],
  parity: [
    { required: true, message: '请选择校验位', trigger: 'change' }
  ]
})
const allRules = ref(createRules())

const dynamicRules = computed(() => {
  const base = {
    device_name: allRules.value.device_name,
    protocol_type: allRules.value.protocol_type
  }
  if (form.value.protocol_type === 'MODBUS_TCP') {
    Object.assign(base, {
      slave_id: allRules.value.slave_id,
      ip_address: allRules.value.ip_address,
      tcp_port: allRules.value.tcp_port
    })
  } else {
    Object.assign(base, {
      serial_port: allRules.value.serial_port,
      baud_rate: allRules.value.baud_rate,
      data_bits: allRules.value.data_bits,
      stop_bits: allRules.value.stop_bits,
      parity: allRules.value.parity
    })
  }
  return base
})

function onProtocolChange () {
  // 切换协议时清空专属字段的校验
  nextTick(() => formRef.value?.clearValidate())
}

/* 提交 */
const submitLoading = ref(false)
async function handleSubmit () {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const api = isAdd.value ? addDevice : updateDevice
    await api(form.value)
    ElMessage.success(isAdd.value ? '新增成功' : '修改成功')
    handleClose()
    emit('refresh') // 通知父组件刷新列表
  } finally {
    submitLoading.value = false
  }
}

function handleClose () {
  visible.value = false
}
</script>