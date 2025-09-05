<template>
  <el-dialog
    v-model="visible"
    title="数据库连接配置"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="connectionForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="连接名称" prop="name">
        <el-input
          v-model="connectionForm.name"
          placeholder="请输入连接名称"
        />
      </el-form-item>
      
      <el-form-item label="主机地址" prop="host">
        <el-input
          v-model="connectionForm.host"
          placeholder="请输入主机地址"
        />
      </el-form-item>
      
      <el-form-item label="端口" prop="port">
        <el-input-number
          v-model="connectionForm.port"
          :min="1"
          :max="65535"
          placeholder="端口"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="数据库名" prop="database">
        <el-input
          v-model="connectionForm.database"
          placeholder="请输入数据库名"
        />
      </el-form-item>
      
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="connectionForm.username"
          placeholder="请输入用户名"
        />
      </el-form-item>
      
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="connectionForm.password"
          type="password"
          placeholder="请输入密码"
          show-password
        />
      </el-form-item>
      
      <!-- <el-form-item label="数据库类型" prop="dbType">
        <el-select
          v-model="connectionForm.dbType"
          placeholder="请选择数据库类型"
          style="width: 100%"
        >
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="SQLite" value="sqlite" />
          <el-option label="SQL Server" value="sqlserver" />
        </el-select>
      </el-form-item> -->
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleTestConnection"
          :loading="testing"
        >
          测试连接
        </el-button>
        <el-button
          type="success"
          @click="handleSaveConnection"
          :loading="saving"
        >
          连接
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { databaseApi } from '../api/api'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'connection-success'])

const visible = ref(false)
const testing = ref(false)
const saving = ref(false)
const formRef = ref()

const connectionForm = reactive({
  name: '10.89.34.9',
  host: '10.89.34.9',
  port: 5432,
  database: 'seis',
  username: 'seis',
  password: 'seis',
  dbType: 'mysql'
})

const rules = {
  name: [{ required: true, message: '请输入连接名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  database: [{ required: true, message: '请输入数据库名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  dbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }]
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(connectionForm, {
    name: '10.89.34.9',
    host: '10.89.34.9',
    port: 5432,
    database: 'seis',
    username: 'seis',
    password: 'seis',
    dbType: 'mysql'
  })
}

const handleTestConnection = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    testing.value = true
    let parm = {
         dbName:connectionForm.database,
         dbHost:connectionForm.host + ":" + connectionForm.port,
         user:connectionForm.username,
		     password:connectionForm.password,
    }
    const result = await databaseApi.testConnection(parm)
    
    if (result.code === 200) {
      ElMessage.success('连接测试成功！')
    } else {
      ElMessage.error(result.message + ":" + result.data)
    }
  } catch (error) {
    console.error('验证失败:', error)
  } finally {
    testing.value = false
  }
}

const handleSaveConnection = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // const result = await databaseApi.saveConnection(connectionForm)
    let parm = {
         dbName:connectionForm.database,
         dbHost:connectionForm.host + ":" + connectionForm.port,
         user:connectionForm.username,
		     password:connectionForm.password,
    }
    const result = await databaseApi.testConnection(parm)
    if (result.code === 200) {
      ElMessage.success('连接成功！')
      emit('connection-success', connectionForm)
      handleClose()
    } else {
      ElMessage.error(result.message + ":" + result.data)
    }
  } catch (error) {
    console.error('连接失败:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>