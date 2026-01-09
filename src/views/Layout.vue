<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 顶部工具栏 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="app-title">
            <img src="/图层 1@1x.png" alt="logo" class="logo" />
            <span>SEIS数据库客户端</span>
          </div>
          <div class="header-actions">
            <!-- <el-button
              type="primary"
              size="small"
              @click="logout"
              :icon="Plus"
            >
              退出登录
            </el-button> -->
            <Backup />
            <SlowQuery />
            <UserAvatar />
          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 左侧数据库树 -->
        <el-aside width="292px" class="app-aside">
          <DatabaseHead @request-connection="handleConnectionRequest" />
          <!-- Splitpanes 必须有固定高度 -->
          <div class="split-wrapper">
            <splitpanes horizontal>
              <!-- 上半部分 -->
              <pane min-size="20" size="57">
                <div class="tree-wrapper">
                  <DatabaseTree
                    @database-selected="handleDatabaseSelect"
                    @table-selected="handleTableSelect"
                    ref="DatabaseTreeRef"
                  />
                </div>
              </pane>

              <!-- 下半部分 -->
              <pane min-size="20" size="43">
                <div class="tree-wrapper">
                  <EquipmentTree
                    @root-selected="handlestorageSelect"
                    ref="eqTree"
                  />
                </div>
              </pane>
            </splitpanes>
          </div>
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="app-main">
          <!-- 把 direction 设置成 vertical -->
          <el-container direction="vertical">
            <el-tabs
              class="tabs"
              v-model="activeTab"
              @tab-click="handleClick"
              @tab-change="handleTabChange"
            >
              <el-tab-pane label="SQL命令行" name="sql">
                <!-- SQL编辑器 -->
                <el-aside class="sql-aside">
                  <SqlEditor />
                </el-aside>

                <!-- 结果区域 -->
                <el-main class="result-main">
                  <ResultArea
                    :result-set="resultSet"
                    :executing="executing"
                    :executed="executed"
                    :execution-time="executionTime"
                    :affected-rows="affectedRows"
                    :messages="messages"
                    :history="history"
                    @export-results="handleExportResults"
                    @calltree="handleCallTree"
                  />
                </el-main>
              </el-tab-pane>
              <!-- 2. 设备管理（无结果区） -->
              <el-tab-pane label="设备管理" name="device">
                <DeviceList ref="deviceRef" />
              </el-tab-pane>

              <!-- 3. 数据存储管理（无结果区） -->
              <el-tab-pane label="数据存储管理" name="storage">
                <DataStorageList ref="storageRef" />
              </el-tab-pane>
            </el-tabs>
          </el-container>
        </el-main>
      </el-container>
    </el-container>

    <!-- 连接配置对话框 -->
    <ConnectionConfig
      v-model="showConnectionDialog"
      @connection-success="handleConnectionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import DatabaseTree from "@/components/DatabaseTree.vue";
import SqlEditor from "@/components/SqlEditor.vue";
import ResultArea from "@/components/ResultArea.vue";
import ConnectionConfig from "@/components/ConnectionConfig.vue";
import DeviceList from "@/components/DeviceList.vue";
import { removeToken } from "@/utils/auth";
import { useRouter } from "vue-router";
import EquipmentTree from "@/components/EquipmentTree.vue";
import DataStorageList from "@/components/DataStorageList.vue";
import { useTabStore } from "@/stores/tab";
import { storeToRefs } from "pinia";
import UserAvatar from "@/components/UserAvatar.vue";
import DatabaseHead from "@/components/DatabaseHead.vue";
import Backup from "@/components/Backup.vue";
import SlowQuery from "@/components/SlowQuery.vue";
const router = useRouter(); // 先拿到实例
// const activeTab = ref('sql')

const DatabaseTreeRef = ref(null);
const tabStore = useTabStore();
const { activeTab } = storeToRefs(tabStore);

// 暴露打开连接对话框的方法
const openConnectionDialog = () => {
  console.log('=== Layout: 收到打开连接对话框请求 ===')
  showConnectionDialog.value = true
};

// 暴露给子组件使用
defineExpose({
  openConnectionDialog
});

// 监听子组件的连接请求事件
const handleConnectionRequest = () => {
  console.log('=== Layout: 收到连接请求事件 ===')
  openConnectionDialog()
};

const handleCallTree = () => {
  console.log("查看调用树");
  DatabaseTreeRef.value?.loadDatabases();
};
const deviceRef = ref(); // 对应 DeviceList
const storageRef = ref(); // 对应 DataStorageList
function handleTabChange(tabName) {
  tabStore.activeTab = tabName;
}

function handleClick(tab) {
  if (tab.props.name === "device" && deviceRef.value) {
    deviceRef.value.Init();
  } else if (tab.props.name === "storage" && storageRef.value) {
    storageRef.value.getList();
  }
}

const sqlCode = ref("");
// 响应式数据
const showConnectionDialog = ref(false);
const currentConnection = ref(null);
const executing = ref(false);
const executed = ref(false);
const executionTime = ref(0);
const affectedRows = ref(0);
const resultSet = reactive({
  columns: [],
  rows: [],
  executionTime: 0,
  affectedRows: 0,
});
const messages = ref([]);
const history = ref([]);

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  console.log('=== Layout: 收到 connection-success 事件 ===')
  console.log('=== Layout: 连接配置:', connectionConfig)
  console.log('=== Layout: 通知 DatabaseTree 更新 ===')
  
  currentConnection.value = connectionConfig;
  
  // 通知 DatabaseTree 组件处理连接成功
  DatabaseTreeRef.value?.handleConnectionSuccess(connectionConfig);
  
  ElMessage.success(`已连接到: ${connectionConfig.name}`);
  console.log('=== Layout: 连接成功处理完成 ===')
};

// 处理数据库选择
const handleDatabaseSelect = (databaseInfo) => {
  // console.log('选择数据库:', databaseInfo)
  // ElMessage.info(`已选择数据库: ${databaseInfo.database}`)

  activeTab.value = "sql";
};

const handlestorageSelect = (databaseInfo) => {
  activeTab.value = "storage";
};

// 处理表选择
const handleTableSelect = (tableInfo) => {
  // console.log('选择表:')
  // ElMessage.info(`已选择表: ${tableInfo.table}`)
  activeTab.value = "sql";
};

// 处理导出结果
const handleExportResults = (resultSet) => {
  console.log("导出结果:", resultSet);
  ElMessage.info("导出功能开发中...");
};

// 组件挂载时的初始化
console.log("SEIS数据库客户端已启动");

function logout() {
  removeToken();
  router.push("/login");
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-container > .el-container {
  flex: 1;
  overflow: hidden; /* 防止双重滚动条 */
}
.app-header {
  background-color: #004d9e;
  color: white;
  padding: 0;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.app-title .el-icon {
  font-size: 20px;
  color: #004d9e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 160px;
}

/* .app-aside {
  background-color: #f8f9fa;
  border-right: 1px solid #e4e7ed;
} */

.app-aside {
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  padding: 0;
  height: 100%; /* ✅ 非常关键 */
}

.split-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; 
  overflow: auto;
}

.tree-wrapper {
  height: 100%;
  overflow: auto;
}

/* 自定义拖动条样式 */
.splitpanes__splitter {
  position: relative;
  background-color: #dcdfe6;
  height: 8px !important; /* 拖动条厚度 */
  cursor: row-resize;
  transition: background-color 0.2s;
}

/* 悬停变色 */
.splitpanes__splitter:hover {
  background-color: #b1b3b8;
}

/* 中间横线 */
.splitpanes__splitter::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;           /* 横线长度 */
  height: 2px;           /* 横线粗细 */
  background-color: #909399;
  border-radius: 1px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 悬停时横线颜色加深 */
.splitpanes__splitter:hover::before {
  background-color: #606266;
}

.sql-aside {
  /* flex: 1; */
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  width: 100%; /* 保证横向占满 */
  overflow: auto;
}

.el-tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.result-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.el-main{
  overflow: hidden;
}

.app-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.app-main .el-container {
  flex: 1;
  overflow: hidden;
}

/* Element Plus 样式覆盖 */
.el-header {
  padding: 0;
}

.el-aside {
  padding: 0;
}

.el-main {
  padding: 0;
  overflow: auto;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.preview {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  background: #fafafa;
}

.el-tabs.el-tabs--top .el-tabs__nav {
  left: 2%;
}

/* 左上角 logo */
.logo {
  position: relative;
  top: 0px;
  left: -9px;
  width: 30px;
  height: auto;
  cursor: pointer;
}

:deep(.tabs .el-tabs__item) {
  padding-left: 1px !important;
  padding-right: 80px !important;
}

.tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.split-container {
  height: 100%;
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
}
</style>



