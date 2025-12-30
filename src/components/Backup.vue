<template>
  <div class="backup-container">
    <el-button
      type="primary"
      size="small"
      @click="openBackupDialog"
      :icon="DocumentCopy"
    >
      数据库备份
    </el-button>

    <!-- 备份配置对话框 -->
    <el-dialog
      v-model="showBackupDialog"
      title="数据库备份配置"
      width="500px"
      :before-close="handleClose"
    >
      <el-form
        ref="backupFormRef"
        :model="backupForm"
        :rules="backupRules"
        label-width="100px"
        class="backup-form"
      >
        <el-form-item label="备份时间" prop="backupTime">
          <el-time-picker
            v-model="backupForm.backupTime"
            format="HH:mm"
            placeholder="选择每天备份时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="源IP地址" prop="sourceIp">
          <el-input
            v-model="backupForm.sourceIp"
            placeholder="请输入源数据库IP地址"
            clearable
          />
        </el-form-item>

        <el-form-item label="目标IP地址" prop="targetIp">
          <el-input
            v-model="backupForm.targetIp"
            placeholder="请输入目标数据库IP地址"
            clearable
          />
        </el-form-item>

        <el-form-item label="备份说明" prop="description">
          <el-input
            v-model="backupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备份任务描述（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            @click="submitBackupConfig"
            :loading="submitting"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { DocumentCopy } from "@element-plus/icons-vue";

// 响应式数据
const showBackupDialog = ref(false);
const submitting = ref(false);
const backupFormRef = ref();

// 表单数据
const backupForm = reactive({
  backupTime: new Date(), // 默认当前时间
  sourceIp: '',
  targetIp: '',
  description: ''
});

// 表单验证规则
const backupRules = {
  backupTime: [
    { required: true, message: '请选择备份时间', trigger: 'change' }
  ],
  sourceIp: [
    { required: true, message: '请输入源IP地址', trigger: 'blur' },
    { 
      pattern: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
      message: '请输入正确的IP地址格式',
      trigger: 'blur'
    }
  ],
  targetIp: [
    { required: true, message: '请输入目标IP地址', trigger: 'blur' },
    { 
      pattern: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
      message: '请输入正确的IP地址格式',
      trigger: 'blur'
    }
  ]
};

// 打开备份对话框
const openBackupDialog = () => {
  showBackupDialog.value = true;
};

// 关闭对话框
const handleClose = () => {
  // 重置表单
  backupFormRef.value?.resetFields();
  showBackupDialog.value = false;
};

// 提交备份配置
const submitBackupConfig = async () => {
  try {
    // 表单验证
    await backupFormRef.value.validate();
    
    submitting.value = true;
    
    // 格式化时间
    const timeString = backupForm.backupTime.toTimeString().slice(0, 5);
    
    // 准备提交数据
    const configData = {
      backupTime: timeString,
      sourceIp: backupForm.sourceIp,
      targetIp: backupForm.targetIp,
      description: backupForm.description,
      createdAt: new Date().toISOString()
    };
    
    // TODO: 这里调用实际的API接口
    // const response = await api.submitBackupConfig(configData);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('备份配置已保存，后台将按照设定时间执行备份任务');
    
    // 关闭对话框
    handleClose();
    
  } catch (error) {
    console.error('提交备份配置失败:', error);
    ElMessage.error('提交失败，请检查输入信息');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.backup-container {
  display: inline-block;
}

.dialog-footer {
  text-align: right;
}

.backup-form {
  margin-right: 20px;
}

:deep(.el-form-item__label) {
  color: #333;
}

:deep(.el-time-picker) {
  width: 100%;
}
</style>