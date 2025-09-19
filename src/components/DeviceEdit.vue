<template>
  <el-dialog
    :title="isAdd ? '新增设备' : '编辑设备'"
    v-model="visible"
    width="420px"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="IP地址" prop="ip">
        <el-input v-model="form.ip" placeholder="如 192.168.1.100" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input v-model.number="form.port" placeholder="如 8080" />
      </el-form-item>
      <el-form-item label="机架号" prop="rack">
        <el-input v-model="form.rack" placeholder="如 1号" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
      <el-button type="success" plain @click="testConnect">连接测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  modelValue: Boolean,
  row: Object
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = ref(false)
const formRef = ref(null)
const form = ref({
  name: '',
  ip: '',
  port: '',
  rack: ''
})

const isAdd = computed(() => !props.row)

watch(() => props.modelValue, val => {
  visible.value = val
  if (val) nextTick(() => fillForm())
})
watch(visible, val => emit('update:modelValue', val))

function fillForm() {
  if (props.row) {
    form.value = { ...props.row }
  } else {
    reset()
  }
}
function reset() {
  form.value = { name: '', ip: '', port: '', rack: '' }
}
function submit() {
  // 简单校验
  if (!form.value.name || !form.value.ip || !form.value.port) {
    ElMessage.warning('请完整填写')
    return
  }
  // 这里写保存接口，成功后关闭并刷新列表
  ElMessage.success(isAdd.value ? '新增成功' : '修改成功')
  emit('refresh')
  visible.value = false
}
function testConnect() {
  if (!form.value.ip || !form.value.port) {
    ElMessage.warning('请先填写 IP 和端口')
    return
  }
  // 真实场景换成后端接口
  axios.get(`http://${form.value.ip}:${form.value.port}/ping`, { timeout: 3000 })
    .then(() => ElMessage.success('连接成功'))
    .catch(() => ElMessage.error('连接失败'))
}
</script>