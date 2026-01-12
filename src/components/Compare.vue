<template>
  <div>
    <!-- 对比按钮 -->
    <el-button @click="dialogVisible = true" type="primary" size="small">
      对比
    </el-button>
    
    <!-- 对比对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="数据库/表对比"
      width="90%"
      destroy-on-close
    >
      <div class="compare-container">
        <!-- 左右两个树容器 -->
        <div class="tree-container">
          <h3>源数据库</h3>
          <div class="tree-wrapper">
            <el-tree 
              :data="leftTreeData" 
              :props="treeProps" 
              default-expand-all
              highlight-current
              @node-click="handleLeftNodeClick"
              :filter-node-method="filterNode"
              ref="leftTree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-radio 
                    v-if="data.type === 'database' || data.type === 'table'"
                    v-model="leftSelectedKey" 
                    :label="data.key"
                    @change="handleLeftSelectChange(data)"
                  ></el-radio>
                  <span>{{ data.label }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        
        <div class="tree-container">
          <h3>目标数据库</h3>
          <div class="tree-wrapper">
            <el-tree 
              :data="rightTreeData" 
              :props="treeProps" 
              default-expand-all
              highlight-current
              @node-click="handleRightNodeClick"
              :filter-node-method="filterNode"
              ref="rightTree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-radio 
                    v-if="data.type === 'database' || data.type === 'table'"
                    v-model="rightSelectedKey" 
                    :label="data.key"
                    @change="handleRightSelectChange(data)"
                  ></el-radio>
                  <span>{{ data.label }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
      
      <!-- 对比按钮 -->
      <div class="compare-buttons">
        <el-button 
          type="primary" 
          @click="compareDatabases" 
          :disabled="!canCompareDatabase"
        >
          对比数据库
        </el-button>
        <el-button 
          type="primary" 
          @click="compareTables" 
          :disabled="!canCompareTable"
        >
          对比表
        </el-button>
      </div>
      
      <!-- 对比结果 -->
      <div v-if="showResult" class="result-container">
        <h3>对比结果</h3>
        <el-card>
          <pre>{{ compareResult }}</pre>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { databaseApi } from '@/api/api.js'
import { useConnStore } from '@/stores/conn'

const connStore = useConnStore()
const dialogVisible = ref(false)
const showResult = ref(false)
const compareResult = ref('')

// 树结构配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 左右树数据
const leftTreeData = ref([])
const rightTreeData = ref([])

// 选中的节点
const leftSelectedKey = ref('')
const rightSelectedKey = ref('')
const leftSelectedNode = ref(null)
const rightSelectedNode = ref(null)

// 树引用
const leftTree = ref(null)
const rightTree = ref(null)

// 计算属性：是否可以对比数据库
const canCompareDatabase = computed(() => {
  return leftSelectedNode.value?.type === 'database' && rightSelectedNode.value?.type === 'database'
})

// 计算属性：是否可以对比表
const canCompareTable = computed(() => {
  return leftSelectedNode.value?.type === 'table' && rightSelectedNode.value?.type === 'table'
})

// 过滤节点，只显示表，不显示视图
const filterNode = (value, data) => {
  return data.type !== 'view'
}

// 加载树数据
async function loadTreeData() {
  if (!connStore.connections || connStore.connections.length === 0) {
    ElMessage.warning('请先连接数据库')
    return
  }
  
  // 为每个连接构建树数据
  const allTreeData = []
  
  // 为每个连接实例构建树
  for (const connection of connStore.connections) {
    try {
      // 使用getDBlist接口获取数据库列表
      const res = await databaseApi.getDBlist(connection)
      if (res.code === 200) {
        const connectionTreeData = buildTreeForConnectionWithDBList(res.data, connection)
        allTreeData.push(connectionTreeData)
      } else {
        // 即使失败，也添加一个空的连接节点
        allTreeData.push({
          label: connection.connectionName,
          type: 'connection',
          key: `conn_${connection.id}`,
          connectionId: connection.id,
          dbHost: connection.dbHost,
          children: []
        })
      }
    } catch (e) {
      // 连接数据库失败，添加空节点
      allTreeData.push({
        label: connection.connectionName,
        type: 'connection',
        key: `conn_${connection.id}`,
        connectionId: connection.id,
        dbHost: connection.dbHost,
        children: []
      })
    }
  }
  
  // 左右树使用相同的数据
  leftTreeData.value = JSON.parse(JSON.stringify(allTreeData))
  rightTreeData.value = JSON.parse(JSON.stringify(allTreeData))
}

// 根据数据库列表构建树结构，参考DatabaseTree.vue
function buildTreeForConnectionWithDBList(dbList, connection) {
  // 确保dbList是数组
  const safeDbList = Array.isArray(dbList) ? dbList : []
  
  const treeNode = {
    label: connection.connectionName,
    type: 'connection',
    key: `conn_${connection.id}`,
    connectionId: connection.id,
    dbHost: connection.dbHost,
    children: safeDbList.map(dbName => ({
      label: dbName,
      type: 'database',
      key: `db_${connection.id}_${dbName}`,
      dbName: dbName,
      connectionId: connection.id,
      connection: connection,
      children: [], // 初始为空，后续加载表
      isLoaded: false // 标记是否已加载表
    }))
  }
  
  return treeNode
}

// 左侧节点点击事件，点击数据库节点时加载表
async function handleLeftNodeClick(data, node) {
  if (data.type === 'database' && !data.isLoaded) {
    await loadTablesAndViews(leftTreeData.value, data, node)
  }
}

// 右侧节点点击事件，点击数据库节点时加载表
async function handleRightNodeClick(data, node) {
  if (data.type === 'database' && !data.isLoaded) {
    await loadTablesAndViews(rightTreeData.value, data, node)
  }
}

// 加载数据库的表，参考DatabaseTree.vue
async function loadTablesAndViews(treeData, databaseNode, treeNode) {
  // 更新节点状态为加载中
  treeNode.loading = true
  
  try {
    // 调用getDatabases接口获取表列表
    const connectionConfig = {
      ...databaseNode.connection,
      dbName: databaseNode.dbName
    }
    
    const res = await databaseApi.getDatabases(connectionConfig)
    
    if (res.code === 200) {
      // 构建表的树结构，只显示表，不显示视图
      const tableList = res.data.tableList || []
      
      // 直接将表作为数据库的子节点，不添加额外的"表"分组
      const tableNodes = tableList.map(t => ({
        label: t.tableName || t.name || '未知表名',
        type: 'table',
        key: `table_${databaseNode.key}_${t.tableName || t.name || 'unknown'}`,
        tableName: t.tableName || t.name || '未知表名',
        dbName: databaseNode.dbName,
        connection: databaseNode.connection
      }))
      
      // 递归更新树数据，避免循环引用
      function updateTree(nodes) {
        return nodes.map(node => {
          // 深拷贝当前节点，避免循环引用
          const newNode = {
            label: node.label,
            type: node.type,
            key: node.key,
            connectionId: node.connectionId,
            dbHost: node.dbHost,
            dbName: node.dbName,
            tableName: node.tableName,
            isLoaded: node.isLoaded,
            connection: node.connection,
            children: []
          };
          
          // 如果是当前要更新的数据库节点，替换其子节点为表列表
          if (node.key === databaseNode.key) {
            newNode.children = tableNodes;
            newNode.isLoaded = true;
          } 
          // 否则递归更新子节点
          else if (node.children && node.children.length > 0) {
            newNode.children = updateTree(node.children);
          }
          
          return newNode;
        });
      }
      
      // 创建新的树数据
      const updatedTreeData = updateTree(treeData);
      
      // 直接替换整个树数据，确保Vue能检测到变化
      if (treeData === leftTreeData.value) {
        leftTreeData.value = updatedTreeData;
      } else {
        rightTreeData.value = updatedTreeData;
      }
    } else {
      ElMessage.error(`加载表失败: ${res.message || '未知错误'}`)
    }
  } catch (e) {
    console.error('加载表请求失败:', e)
    ElMessage.error('加载表请求失败')
  } finally {
    // 结束加载状态
    treeNode.loading = false
  }
}

// 移除不再需要的findAndUpdateNode函数

// 左侧选择变化事件
function handleLeftSelectChange(data) {
  leftSelectedNode.value = data
}

// 右侧选择变化事件
function handleRightSelectChange(data) {
  rightSelectedNode.value = data
}

// 对比数据库
async function compareDatabases() {
  if (!canCompareDatabase.value) {
    ElMessage.warning('请先选择两个数据库进行对比')
    return
  }
  
  try {
    showResult.value = false
    compareResult.value = '正在对比数据库...'
    
    // 构建对比参数
    const params = {
      sourceDb: {
        dbName: leftSelectedNode.value.label,
        dbHost: leftSelectedNode.value.connection.dbHost,
        user: leftSelectedNode.value.connection.user,
        password: leftSelectedNode.value.connection.password
      },
      targetDb: {
        dbName: rightSelectedNode.value.label,
        dbHost: rightSelectedNode.value.connection.dbHost,
        user: rightSelectedNode.value.connection.user,
        password: rightSelectedNode.value.connection.password
      }
    }
    
    // 预留对比数据库接口调用位置
    // const response = await databaseApi.compareDatabase(params)
    // if (response.code === 200) {
    //   compareResult.value = JSON.stringify(response.data, null, 2)
    // } else {
    //   ElMessage.error(`对比数据库失败: ${response.message || '未知错误'}`)
    //   compareResult.value = `对比失败: ${response.message || '未知错误'}`
    // }
    
    // 模拟结果
    compareResult.value = JSON.stringify({
      code: 200,
      message: '对比成功',
      data: {
        sourceDb: params.sourceDb.dbName,
        targetDb: params.targetDb.dbName,
        difference: {
          tablesOnlyInSource: ['table1', 'table2'],
          tablesOnlyInTarget: ['table3', 'table4'],
          tablesInBoth: ['user', 'product']
        }
      }
    }, null, 2)
    
    showResult.value = true
  } catch (error) {
    // console.error('对比数据库请求失败:', error)
    ElMessage.error('对比数据库请求失败')
    compareResult.value = `请求失败: ${error.message || '未知错误'}`
    showResult.value = true
  }
}

// 对比表
async function compareTables() {
  if (!canCompareTable.value) {
    ElMessage.warning('请先选择两个表进行对比')
    return
  }
  
  try {
    showResult.value = false
    compareResult.value = '正在对比表...'
    
    // 构建对比参数
    const params = {
      sourceTable: {
        dbName: leftSelectedNode.value.dbName,
        tableName: leftSelectedNode.value.tableName,
        dbHost: leftSelectedNode.value.connection.dbHost,
        user: leftSelectedNode.value.connection.user,
        password: leftSelectedNode.value.connection.password
      },
      targetTable: {
        dbName: rightSelectedNode.value.dbName,
        tableName: rightSelectedNode.value.tableName,
        dbHost: rightSelectedNode.value.connection.dbHost,
        user: rightSelectedNode.value.connection.user,
        password: rightSelectedNode.value.connection.password
      }
    }
    
    // 预留对比表接口调用位置
    // const response = await databaseApi.compareTable(params)
    // if (response.code === 200) {
    //   compareResult.value = JSON.stringify(response.data, null, 2)
    // } else {
    //   ElMessage.error(`对比表失败: ${response.message || '未知错误'}`)
    //   compareResult.value = `对比失败: ${response.message || '未知错误'}`
    // }
    
    // 模拟结果
    compareResult.value = JSON.stringify({
      code: 200,
      message: '对比成功',
      data: {
        sourceTable: `${params.sourceTable.dbName}.${params.sourceTable.tableName}`,
        targetTable: `${params.targetTable.dbName}.${params.targetTable.tableName}`,
        difference: {
          columnsOnlyInSource: ['column1', 'column2'],
          columnsOnlyInTarget: ['column3', 'column4'],
          columnsInBoth: ['id', 'name', 'created_at'],
          columnDifferences: [
            {
              columnName: 'status',
              sourceType: 'int(11)',
              targetType: 'varchar(255)'
            }
          ]
        }
      }
    }, null, 2)
    
    showResult.value = true
  } catch (error) {
    // console.error('对比表请求失败:', error)
    ElMessage.error('对比表请求失败')
    compareResult.value = `请求失败: ${error.message || '未知错误'}`
    showResult.value = true
  }
}

// 对话框打开时加载数据
const handleOpen = () => {
  loadTreeData()
  // 重置选中状态
  leftSelectedKey.value = ''
  rightSelectedKey.value = ''
  leftSelectedNode.value = null
  rightSelectedNode.value = null
  showResult.value = false
  compareResult.value = ''
}

// 监听对话框显示变化
const unwatch = watch(dialogVisible, (newVal) => {
  if (newVal) {
    handleOpen()
  }
})

// 组件卸载时清理监听
onMounted(() => {
  // 组件挂载时的初始化逻辑
})

onUnmounted(() => {
  unwatch()
})
</script>

<style scoped>
.compare-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  height: 500px;
}

.tree-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tree-container h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.tree-wrapper {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: auto;
  padding: 10px;
  background-color: #f5f7fa;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compare-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.result-container {
  margin-top: 20px;
}

.result-container h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.result-container pre {
  max-height: 300px;
  overflow: auto;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
}
</style>