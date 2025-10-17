<template>
  <el-dialog
  title="存储配置"
  width="600px"
  @closed="onClosed"
>
    <el-form ref="formRef" :rules="rules" :model="form" label-width="130px">
      <!-- PLC 设备 -->
      <el-form-item label="PLC设备" prop="plcDevice">
        <el-select
          v-model="form.plcDevice"
          filterable
          allow-create
          value-key="id"
          placeholder="请选择或输入PLC设备"
          style="width: 100%"
          @change="onPlcChange"
          :disabled="isEdit"
        >
          <el-option
            v-for="item in plcOptions"
              :key="item.id"
              :label="item.device_name"
              :value="item"
          />
        </el-select>
      </el-form-item>

      <!-- 数据存储 -->
      <el-form-item label="数据存储" prop="dataStorage">
        <el-input
          v-model="form.dataStorage"
          placeholder="请输入数据存储名"
        />
      </el-form-item>

      <!-- 数据间隔 -->
      <el-form-item label="数据间隔(ms)" prop="interval">
        <el-input type="number"
          v-model="form.interval"
          placeholder="请输入数据间隔（毫秒）"
        />
      </el-form-item>

      <!-- 测点选择 -->
      <el-form-item label="测点选择" prop="points">
          <el-table
            ref="tableRef"
            :data="pointOptions"
            row-key="registerid"
            @selection-change="val => form.points = val"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="point_name" label="测点名称" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { onMounted, ref, watch,reactive,nextTick,computed  } from 'vue'
import { databaseApi } from '@/api/api'
import { useConnStore } from '@/stores/conn'
import { ElMessage,ElMessageBox } from 'element-plus'
import { useTreeStore } from '@/stores/treeStore'
const treeStore = useTreeStore()
const connStore = useConnStore()
const tableRef = ref(null)  
const props = defineProps({
  visible: Boolean,
  row: {          // 这里叫 row，对应 :row="currentRow"
    type: Object,
    default: () => ({})
  }
})
const formRef = ref(null) // 表单实例
const form = ref({
  configid:'',//configid
  plcDevice: '',
  dataStorage: '',
  interval: '',
  status:null,
  points: []
})

const isEdit = computed(() => {
  return !!(props.row && props.row.deviceid)
})

// 模拟接口返回数据
const plcOptions = ref([])
const treeData = ref([])
const pointOptions = ref([])
const configList = ref([]) 

const getConfiguredDeviceIds = () => {
  const idSet = new Set()
  if (Array.isArray(configList.value)) {
    configList.value.forEach(cfg => idSet.add(cfg.deviceid))
  }
  return idSet
}
const fetchConfigList = async () => {
  try {
    const res = await databaseApi.getallconfiginfotj(connStore.conn)
    if (res.code === 200 && Array.isArray(res.data)) {
      configList.value = res.data
    }
  } catch (e) {
    ElMessage.error('获取已存在配置列表失败')
  }
}
/* 校验规则 */
const rules = reactive({
  plcDevice: [
    { required: true, message: '请选择 PLC 设备', trigger: 'change' }
  ],
  dataStorage: [
    { required: true, message: '请输入存储名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度 2-50 个字符', trigger: 'blur' },
    // {
    //   validator: (_, val, cb) => {
    //     console.log('')
    //     // const n = Number(val)
    //     // if (Number.isInteger(n) && n > 0 && n <= 86400) cb()
    //     // else cb(new Error('请输入 1-86400 的整数秒'))
    //   },
    //   trigger: 'blur'
    // }
  ],
  interval: [
    { required: true, message: '请输入数据间隔', trigger: 'blur' },
    {
      validator: (_, val, cb) => {
        const n = Number(val)
        if (Number.isInteger(n) && n > 0 && n <= 86400) cb()
        else cb(new Error('请输入 1-86400 的整数秒'))
      },
      trigger: 'blur'
    }
  ],
  points: [
    {
      validator: (_, val, cb) =>
        val && val.length > 0 ? cb() : cb(new Error('至少选择一个测点')),
      trigger: 'change'
    }
  ]
})


const initForm = (row) => {
  // console.log('row',row)
  // 根据 row 回显表单
  form.value.configid = row.configid
  form.value.plcDevice = { id: row.deviceid, device_name: row.devicename }
  form.value.dataStorage = row.configname   // 或 row.configname 看你绑定的 value
  form.value.interval = row.refreshinterval
  form.value.status = row.status
  fetchPoints(row.deviceid)
  // 测点回显
  // checkByConfig(row.configid)
}

const initAdd = () => {
  // 根据 row 回显表单
  form.value.plcDevice = { }
  form.value.dataStorage = ''   // 或 row.configname 看你绑定的 value
  form.value.interval = ''
  pointOptions.value = []
}

watch(() => props.row, (newVal) => {
  // console.log('子组件收到', newVal)
  initAdd()
  if (!newVal) return          // 新增时 newVal 为 null
  // 下面做回显逻辑
  initForm(newVal)
}, { immediate: true })  

// watch(() => props.visible, async (val) => {
//   if (!val) return          // 弹窗关闭时不处理
//   await fetchConfigList()   // 重新拿“已有配置”
//   fetchPlcDevices()         // 重新算 PLC 列表（内部会根据 isEdit 自动决定是否过滤）
// }, { immediate: true })


// 随便用
// console.log('子组件收到', props.row)

const emit = defineEmits(['update:visible', 'confirm'])






const fetchPlcDevices = async () => {
  try {
    // initAdd()
    const res = await databaseApi.getdevicelist(connStore.conn)
    // console.log(' fetchPlcDevices res',res)
    if (res.code === 200) {
      if(Array.isArray(res.data))
      {
          let list = res.data.map(item => ({
            id: item.id,
            device_name: item.device_name
          }))
          // console.log('fetchPlcDevices list all',list)
          if (!isEdit.value) {
                const res2 = await databaseApi.getallconfiginfotj(connStore.conn)
                if (res2.code === 200 && Array.isArray(res2.data)) {
                  // console.log('getallconfiginfotj',res2.data)
                  let existed = res2.data
                    const existedIds = new Set(existed.map(i => i.deviceid))
                    // console.log('existedIds',existedIds)
                    list = list.filter(p => !existedIds.has(p.id))
                    // console.log('plcOptions.value',list)
                }

            
          }
          // console.log('plcOptions.value',list)
          plcOptions.value = list
      }

    }else
    {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('PLC设备列表加载失败')
  }
}


/* PLC 选中事件 */
const onPlcChange = (val) => {
  form.value.dataStorage = '' // 清空旧选中
  fetchPoints(val.id)
}


//看已经勾选了哪些测点
const checkByConfig = (configid) => {
  // 1. 找到 configid = 1 的寄存器列表
  // console.log('treeedata',treeData.value)
  // console.log('form.value.plcDevice',form.value.plcDevice)
  
  const plc = treeData.value.find(p => p.deviceid === form.value.plcDevice?.id)
  // console.log('plc',plc)
  const cfg = plc?.lsConfig.find(c => c.configid === configid)
  const regIds = cfg?.lsRegisters.map(r => r.registersid) ?? []
  // console.log('regIds',regIds)
  // 2. 遍历表格数据，勾选匹配行
  nextTick(() => {
    pointOptions.value.forEach(row => {
      const checked = regIds.includes(row.registerid)
      tableRef.value.toggleRowSelection(row, checked)
    })
  })
}


const fetchStorageOptions = async () => {
  try {
    const res = await databaseApi.getallconfiginfo(connStore.conn)
    if(res.code === 200)
    {
      treeData.value = res.data
    }else
    {

    }
  }catch
  {

  }
  // storageOptions.push(...res)
}
const fetchPoints = async (deviceid) => {
  try {
    const parm = { ...connStore.conn, oprationString: String(deviceid) }
    const res = await databaseApi.getregisterbydeviceid(parm)
    if (res.code === 200) {
      // 1. 先赋值
      pointOptions.value = res.data.data.map(item => ({
        ...item,
        remark: '注释'
      }))

      // // 2. 等 DOM 更新完再回显勾选
      // await nextTick()
      // // 如果仍不行，再补一层 nextTick
      // await nextTick()

      // 3. 现在勾选才生效
      if (props.row?.configid) {
        checkByConfig(props.row.configid)
      }
    }
  } catch {
    ElMessage.error('加载测点失败')
  }
}
const handleConfirm = async () => {
  try {
    await formRef.value.validate()
// console.log('form.points：', form.points)
    const ids = form.value.points.map(p => p.registerid)
  //  console.log('已选 id：', ids)
    let modbusexectree ={
                "id":isEdit.value ? form.value.configid: 0,
                "name":form.value.dataStorage,
                "deviceid":form.value.plcDevice.id,
                "refreshinterval":form.value.interval,
                "status":1,
                "lsRegistersconfig":ids
		}
    const parm = { ...connStore.conn, modbusexectree: modbusexectree }
    const res = await databaseApi.execconfig(parm)
    if(res.code ===200)
    {
      ElMessage.success('提交成功')
      // visible.value = false
      emit('refresh')          // ← 通知父组件刷新
      emit('update:visible', false) // ← 关闭弹窗
      treeStore.triggerRefresh()
    }else
    {
      ElMessage.error(res.message)
    }
    emit('confirm', { ...form.value })
    emit('update:visible', false)
  } catch {
    ElMessage.warning('请正确填写表单')
  }
}


const loadData = () => {
    fetchPlcDevices()
    fetchStorageOptions()
    // fetchPoints()
}

const onClosed = () => {
  formRef.value?.resetFields()
  initAdd()
  loadData()
  emit('refresh')
}

onMounted(async () => {
  await fetchConfigList()   
  loadData()
})


function handleClose () {
  emit('refresh') 
}

defineExpose({ fetchPlcDevices ,initForm})
</script>

<style scoped> 
</style>