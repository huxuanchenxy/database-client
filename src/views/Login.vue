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
        label-height="70px"
        @keyup.enter="handleLogin"
      >
        <div class="input-box-username">
          <el-form-item prop="username">
              <template #label>
                <div class="label-pic">
                  <img src="/容器@1x.png" alt="账号" />
                </div>
              </template>
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              class="large-input"
            />
          </el-form-item>
        </div>
        <div class="input-box-password">
          <el-form-item prop="password">
              <template #label>
                <div class="label-pic">
                  <img src="/路径@1x.png" alt="密码" />
                </div>
              </template>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
        </div>
        <div class="login-btn">
          <el-button
            type="primary"
            style="width: 100%; height: 100%; font-size: 23px"
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
  right: 9%;
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
  font-size: 23px;
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
  left: 30px;
  top: 130px;
  width: 85.5%;
  height: 12.4%;
  border-radius: 10px;
  opacity: 1;

  box-sizing: border-box;
  border: 1px solid #999999;

    display: flex;        /* 新增 */
  align-items: stretch; /* 垂直撑满 */
}

.input-box-password {
  position: absolute;
  left: 30px;
  top: 220px;
  width: 85.5%;
  height: 12.4%;
  border-radius: 10px;
  opacity: 1;

  box-sizing: border-box;
  border: 1px solid #999999;
    display: flex;        /* 新增 */
  align-items: stretch; /* 垂直撑满 */
}

/* 让 form-item 本身占满 */
.input-box-username .el-form-item,
.input-box-password .el-form-item {
  width: 100%;
  margin: 0;              /* 去掉默认 22px 下边距 */
  display: flex;          /* 关键：让 label 和 content 在同一行 */
  align-items: stretch;
}

/* 让 form-item__content 也 100% 高 */
.input-box-username .el-form-item__content,
.input-box-password .el-form-item__content {
  flex: 1;                /* 占满剩余空间 */
  display: flex;
  align-items: stretch;
}

/* 最后 input 本身 100% 宽即可 */
.input-box-username .el-input,
.input-box-password .el-input {
  width: 100%;
  height: 82%;
  --el-input-font-size: 23px;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;          /* 去掉默认灰色 inset 边框 */
}

:deep(.el-form-item__label) {
  height: 100%;
}


:deep(.el-form-item__label::before) {
  content: '' !important;
  display: none !important;
}

.large-input {
  --el-input-font-size: 24px;
}

/* 图片容器居中 */
.label-pic {
  width: 100%;
  height: 100%;              
  display: flex;
  align-items: center;
  justify-content: center;
}


/* 控制图片大小 */
.label-pic img {
  width: 20px;   /* 想要多大写多大 */
  height: 20px;
}

:deep(.el-card__header) {
  border-bottom: none !important;
  top: 20px;
    position: relative;
}
</style>
