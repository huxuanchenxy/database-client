<template>
  <div class="login-wrap">
    <el-card class="login-box" shadow="never">
      <template #header>
        <div class="card-header">SEIS 数据库登录</div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="70px"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
        <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入强密码"
            show-password
        />
        <!-- <div class="pwd-tips">
            8-20位且同时包含大写、小写、数字、特殊字符
        </div> -->
        </el-form-item>

        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { setToken } from '@/utils/auth'
import { databaseApi } from '@/api/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

// const rules = {
//   username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
//   password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
// }

// 强密码正则
const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[^\s]{8,20}$/

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (!strongPwd.test(value)) {
          cb(new Error('密码强度不足'))
        } else {
          cb()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function handleLogin() {
  await formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      // 调后端鉴权接口
      let parms = {user: form.username,
                        password: form.password
                    }
      let ret = await databaseApi.login(parms)

      console.log(ret)
    //   setToken(data.token)
        if(ret.code === 200)
        {
            setToken('token')
            ElMessage.success('登录成功')
            router.replace('/')     
        }else
        {
            ElMessage.error(ret.message)
        }
    } catch (e) {
      ElMessage.error(e?.msg || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f3f3;
}
.login-box {
  width: 420px;
}
.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>