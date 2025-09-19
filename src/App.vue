<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 顶部工具栏 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="app-title">
            <el-icon><Database /></el-icon>
            <span>SEIS数据库客户端</span>
          </div>
          <div class="header-actions">
            <!-- <el-button
              type="primary"
              size="small"
              @click="showConnectionDialog = true"
              :icon="Plus"
            >
              新建连接
            </el-button> -->

          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 左侧数据库树 -->
        <el-aside width="300px" class="app-aside">
          <DatabaseTree
            @database-selected="handleDatabaseSelect"
            @table-selected="handleTableSelect"
            ref="DatabaseTreeRef"
          />
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="app-main">
          <!-- 把 direction 设置成 vertical -->
          <el-container direction="vertical">

            <el-tabs v-model="activeTab" class="demo-tabs">
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
                <!-- <DeviceList /> -->
              </el-tab-pane>

              <!-- 3. 数据存储管理（无结果区） -->
              <el-tab-pane label="数据存储管理" name="storage">
                <!-- <StorageManage /> -->
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { Database, Plus, InfoFilled } from '@element-plus/icons-vue'
import DatabaseTree from './components/DatabaseTree.vue'
import SqlEditor from './components/SqlEditor.vue'
import ResultArea from './components/ResultArea.vue'
import ConnectionConfig from './components/ConnectionConfig.vue'
import DeviceList from '@/components/DeviceList.vue'

const activeTab = ref('sql')
const DatabaseTreeRef = ref(null)

const handleCallTree = () => {
  console.log('查看调用树')
  DatabaseTreeRef.value?.loadDatabases()
}

const sqlCode = ref('')
// 响应式数据
const showConnectionDialog = ref(false)
const currentConnection = ref(null)
const executing = ref(false)
const executed = ref(false)
const executionTime = ref(0)
const affectedRows = ref(0)
const resultSet = reactive({
  columns: [],
  rows: [],
  executionTime: 0,
  affectedRows: 0
})
const messages = ref([])
const history = ref([])

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  currentConnection.value = connectionConfig
  ElMessage.success(`已连接到: ${connectionConfig.name}`)
}

// 处理数据库选择
const handleDatabaseSelect = (databaseInfo) => {
  // console.log('选择数据库:', databaseInfo)
  // ElMessage.info(`已选择数据库: ${databaseInfo.database}`)

  activeTab.value = 'sql'
}

// 处理表选择
const handleTableSelect = (tableInfo) => {
  // console.log('选择表:')
  // ElMessage.info(`已选择表: ${tableInfo.table}`)
  activeTab.value = 'sql'
}



// 处理导出结果
const handleExportResults = (resultSet) => {
  console.log('导出结果:', resultSet)
  ElMessage.info('导出功能开发中...')
}



// 组件挂载时的初始化
console.log('SEIS数据库客户端已启动')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100vh;
}

.app-header {
  background-color: #2c3e50;
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
  color: #409eff;
}

.app-aside {
  background-color: #f8f9fa;
  border-right: 1px solid #e4e7ed;
}

.sql-aside {
  flex: 1;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  width: 100%; /* 保证横向占满 */
  overflow: auto;
}

.result-main {
  flex: 1;
  background-color: #fff;
  padding: 0;
  overflow: auto;
}

.app-main .el-container {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
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
  overflow: hidden;
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
</style>