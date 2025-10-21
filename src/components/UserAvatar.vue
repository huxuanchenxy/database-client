<template>
  <div class="user-avatar">
    <el-dropdown trigger="click" @command="handleCommand">
      <span class="user-dropdown">
        <el-avatar :src="avatarUrl" size="small" />
        <el-icon class="arrow"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="logout">退出系统</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { removeToken } from '@/utils/auth'
import { useRouter } from 'vue-router'
const router = useRouter()  
const avatarUrl = ref('/avatar.png') // 你可以换成真实的头像路径

const handleCommand = (command) => {
  if (command === 'profile') {
    ElMessage.info('进入用户管理')
    // 可以在这里跳转路由，比如：
    // router.push('/user/profile')
  } else if (command === 'logout') {
    removeToken()
    router.push('/login')
  }
}
</script>

<style scoped>
.user-avatar {
  position: absolute;
  right: 20px;
  top: 17px;
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
}

.arrow {
  margin-left: 4px;
  color: white;
  font-size: 16px;
}
</style>
