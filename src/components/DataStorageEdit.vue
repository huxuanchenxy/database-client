<template>
  <el-dialog
    :title="isAdd ? '新增配置' : '修改配置'"
    v-model="visible"
    width="460px"
    @closed="reset"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="选择PLC设备" prop="deviceName">
        <el-select v-model="form.deviceName" placeholder="请选择">
          <el-option label="PLC-A" value="PLC-A" />
          <el-option label="PLC-B" value="PLC-B" />
        </el-select>
      </el-form-item>

      <el-form-item label="数据表" prop="table">
        <el-input v-model="form.table" placeholder="如 plc_data" />
      </el-form-item>

      <el-form-item label="存储间隔" prop="interval">
        <el-input v-model="form.interval" placeholder="如 1秒 / 自动" />
      </el-form-item>

      <el-form-item label="数据点选择" prop="point">
        <el-input
          v-model="form.point"
          placeholder="如 24/30 或 自动"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存配置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  row: Object
})
const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = ref(false)
const formRef = ref(null)
const form = ref({
  deviceName: '',
  table: '',
  interval: '',
  point: ''
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
  form.value = { deviceName: '', table: '', interval: '', point: '' }
}
function submit() {
  if (!form.value.deviceName || !form.value.table) {
    ElMessage.warning('请完整填写')
    return
  }
  // TODO: 调接口保存
  ElMessage.success(isAdd.value ? '新增成功' : '修改成功')
  emit('refresh')
  visible.value = false
}
</script>