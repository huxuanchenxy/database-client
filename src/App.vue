<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 顶部工具栏 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="app-title">
            <el-icon><Database /></el-icon>
            <span>SESI数据库客户端</span>
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
            :on-database-select="handleDatabaseSelect"
            :on-table-select="handleTableSelect"
          />
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="app-main">
          <el-container>
            <!-- SQL编辑器 -->
            <el-aside width="50%" class="sql-aside">
              <SqlEditor
                :connection="currentConnection"
                @execute="handleExecuteSql"
              />
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
              />
            </el-main>
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
  console.log('选择数据库:', databaseInfo)
  ElMessage.info(`已选择数据库: ${databaseInfo.database}`)
}

// 处理表选择
const handleTableSelect = (tableInfo) => {
  console.log('选择表:', tableInfo)
  ElMessage.info(`已选择表: ${tableInfo.table}`)
}

// 处理SQL执行
const handleExecuteSql = async (executionData) => {
  executing.value = true
  executed.value = false
  executionTime.value = 0
  affectedRows.value = 0
  
  try {
    // 模拟API调用 - 在实际项目中，这里应该调用真实的API
    console.log('执行SQL:', executionData.sql)
    console.log('连接配置:', executionData)
    
    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟结果数据
    const mockResult = {
      columns: ['id', 'name', 'email', 'created_at'],
      rows: [
        [1, '张三', 'zhangsan@example.com', '2024-01-01 10:00:00'],
        [2, '李四', 'lisi@example.com', '2024-01-02 11:00:00'],
        [3, '王五', 'wangwu@example.com', '2024-01-03 12:00:00']
      ],
      executionTime: 125,
      affectedRows: 0
    }
    
    // 更新结果数据
    Object.assign(resultSet, mockResult)
    executionTime.value = mockResult.executionTime
    affectedRows.value = mockResult.affectedRows
    
    // 添加消息
    messages.value.push({
      type: 'success',
      content: `SQL执行成功，返回 ${mockResult.rows.length} 行数据`,
      timestamp: Date.now()
    })
    
    // 添加到历史记录
    if (currentConnection.value) {
      history.value.unshift({
        id: Date.now(),
        sql: executionData.sql,
        timestamp: Date.now(),
        executionTime: mockResult.executionTime,
        result: mockResult,
        connection: currentConnection.value
      })
      
      // 限制历史记录数量
      if (history.value.length > 100) {
        history.value = history.value.slice(0, 100)
      }
    }
    
    executed.value = true
    
    ElMessage.success('SQL执行完成')
    
  } catch (error) {
    console.error('执行SQL失败:', error)
    messages.value.push({
      type: 'error',
      content: `执行失败: ${error.message || '未知错误'}`,
      timestamp: Date.now()
    })
    ElMessage.error('SQL执行失败')
  } finally {
    executing.value = false
  }
}

// 处理导出结果
const handleExportResults = (resultSet) => {
  console.log('导出结果:', resultSet)
  ElMessage.info('导出功能开发中...')
}

// 显示关于信息
const showAbout = () => {
  ElMessageBox.alert(
    `
    <div style="text-align: left;">
      <h3>SESI数据库客户端</h3>
      <p><strong>版本:</strong> 1.0.0</p>
      <p><strong>描述:</strong> 基于Vue3的数据库管理工具</p>
      <p><strong>功能:</strong></p>
      <ul>
        <li>数据库连接管理</li>
        <li>SQL编辑器（语法高亮）</li>
        <li>SQL执行和结果展示</li>
        <li>执行历史记录</li>
        <li>多标签页支持</li>
      </ul>
    </div>
    `,
    '关于SESI数据库客户端',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

// 组件挂载时的初始化
console.log('SESI数据库客户端已启动')
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
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 0;
}

.result-main {
  background-color: #fff;
  padding: 0;
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
</style>