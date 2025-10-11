<template>
  <div class="login-wrap">
    <!-- 左上角 logo -->
    <img src="/图层 1@1x.png" alt="logo" class="logo" />
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
        <div class="input-box-username">
          <el-form-item label="账号" prop="username">
            <el-input
              class="no-border"
              v-model="form.username"
              placeholder="请输入账号"
            />
          </el-form-item>
        </div>
        <div class="input-box-password">
          <el-form-item label="密码" prop="password">
            <el-input
              class="no-border"
              v-model="form.password"
              type="password"
              placeholder="请输入强密码"
              show-password
            />
          </el-form-item>
        </div>
        <div class="login-btn">
          <el-button
            type="primary"
            style="width: 100%; height: 100%; font-size: 24px"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { setToken } from "@/utils/auth";
import { databaseApi } from "@/api/api";

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

// const rules = {
//   username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
//   password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
// }

// 强密码正则
const strongPwd =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[^\s]{8,20}$/;

const rules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    {
      validator: (rule, value, cb) => {
        if (!strongPwd.test(value)) {
          cb(new Error("密码强度不足"));
        } else {
          cb();
        }
      },
      trigger: "blur",
    },
  ],
};

async function handleLogin() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      // 调后端鉴权接口
      let parms = { user: form.username, password: form.password };
      let ret = await databaseApi.login(parms);

      console.log(ret);
      //   setToken(data.token)
      if (ret.code === 200) {
        setToken("token");
        ElMessage.success("登录成功");
        router.replace("/");
      } else {
        ElMessage.error(ret.message);
      }
    } catch (e) {
      ElMessage.error(e?.msg || "登录失败");
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url(/未标题-1@1x.png) no-repeat left center / cover;
  position: relative;
}
.login-box {
  position: absolute;
  top: 30%;
  right: 15%;
  width: 420px;
  height: 420px;
  border-radius: 24px;
  opacity: 1;

  background: #ffffff;

  box-shadow: 0px 0px 10px 0px rgba(99, 99, 99, 0.6);
}

.card-header {
  height: 6.78%;
  opacity: 1;

  font-family: Source Han Sans;
  font-size: 24px;
  font-weight: bold;
  line-height: normal;
  letter-spacing: 0em;

  font-variation-settings: "opsz" auto;
  font-feature-settings: "kern" on;
  color: #0072ff;
  text-align: center;
}
.login-btn {
  position: absolute;
  bottom: 11%;
  left: 50%; /* 关键 */
  transform: translateX(-50%); /* 往回挪自身一半 */
  width: 85.5%;
  height: 12.4%;
  border-radius: 10px;
  background: #0072ff;
}

/* 左上角 logo */
.logo {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 48px; /* 按需调大小 */
  height: auto;
  cursor: pointer;
}

.input-box-username {
  position: absolute;
  left: 36px;
  top: 130px;
  width: 85.5%;
  height: 12.4%;
  border-radius: 10px;
  opacity: 1;

  box-sizing: border-box;
  border: 1px solid #999999;
}

.input-box-password {
  position: absolute;
  left: 36px;
  top: 220px;
  width: 85.5%;
  height: 12.4%;
  border-radius: 10px;
  opacity: 1;

  box-sizing: border-box;
  border: 1px solid #999999;
}

.no-border {
  --el-input-border: none;
  --el-input-hover-border: none;
  --el-input-focus-border: none;
}
</style>
