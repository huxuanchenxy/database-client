<template>
  <div class="database-tree">
    <div class="tree-header">
      <el-button
        type="primary"
        @click="showConnectionDialog = true"
        :icon="Plus"
      >
        连接数据库
      </el-button>
      
      <div v-if="currentConnection" class="connection-info">
        <el-tag type="info">
          已连接: {{ currentConnection.name }}
        </el-tag>
      </div>
    </div>

    <el-divider />

    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :highlight-current="true"
      node-key="id"
      class="database-tree-view"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="tree-node">
          <el-icon v-if="data.icon">
            <component :is="data.icon" />
          </el-icon>
          <span>{{ node.label }}</span>
        </span>
      </template>
    </el-tree>

    <!-- 连接配置对话框 -->
    <ConnectionConfig
      v-model="showConnectionDialog"
      @connection-success="handleConnectionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { databaseApi } from '../api/api'
import ConnectionConfig from './ConnectionConfig.vue'

const props = defineProps({
  onDatabaseSelect: Function,
  onTableSelect: Function
})

const emit = defineEmits(['database-selected', 'table-selected'])

const showConnectionDialog = ref(false)
const treeRef = ref()
const currentConnection = ref(null)
const treeData = ref([])
const loading = ref(false)

const treeProps = {
  children: 'children',
  label: 'label'
}

// 构建树形数据
const buildTreeData = (data) => {
  const tree = []
  
  if (data.databases && data.databases.length > 0) {
    const databases = {
      id: 'databases',
      label: '🗃️ 数据库',
      icon: 'Folder',
      children: []
    }
    
    data.databases.forEach(db => {
      databases.children.push({
        id: `db_${db}`,
        label: db,
        icon: 'Database',
        type: 'database',
        database: db,
        connection: currentConnection.value
      })
    })
    
    tree.push(databases)
  }
  
  return tree
}

// 处理节点点击
const handleNodeClick = async (data) => {
  if (data.type === 'database') {
    try {
      loading.value = true
      ElMessage.info(`正在加载数据库 ${data.database} 的表...`)
      
      const result = await databaseApi.getTables({
        ...currentConnection.value,
        database: data.database
      })
      
      if (result.success) {
        // 更新树形数据，添加表信息
        const updatedTreeData = [...treeData.value]
        const databasesNode = updatedTreeData.find(node => node.id === 'databases')
        
        if (databasesNode) {
          const dbNode = databasesNode.children.find(child => child.database === data.database)
          if (dbNode) {
            dbNode.children = result.data.map(table => ({
              id: `table_${data.database}_${table}`,
              label: table,
              icon: 'Document',
              type: 'table',
              database: data.database,
              table: table,
              connection: currentConnection.value
            }))
          }
        }
        
        treeData.value = updatedTreeData
        ElMessage.success(`加载表成功，共 ${result.data.length} 个表`)
        
        // 触发表选择事件
        if (props.onTableSelect) {
          props.onTableSelect(data)
        }
        if (emit) {
          emit('table-selected', data)
        }
      }
    } catch (error) {
      console.error('加载表失败:', error)
      ElMessage.error('加载表失败: ' + (error.message || '未知错误'))
    } finally {
      loading.value = false
    }
  } else if (data.type === 'table') {
    // 触发表选择事件
    if (props.onTableSelect) {
      props.onTableSelect(data)
    }
    if (emit) {
      emit('table-selected', data)
    }
  }
}

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  currentConnection.value = connectionConfig
  loadDatabases()
}

// 加载数据库列表
const loadDatabases = async () => {
  if (!currentConnection.value) return
  
  try {
    loading.value = true
    const result = await databaseApi.getDatabases(currentConnection.value)
    
    if (result.success) {
      treeData.value = buildTreeData(result.data)
      ElMessage.success('连接成功，数据库列表已加载')
    } else {
      ElMessage.error('加载数据库列表失败: ' + result.message)
    }
  } catch (error) {
    console.error('加载数据库失败:', error)
    ElMessage.error('加载数据库失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.database-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.tree-header {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-info {
  display: flex;
  align-items: center;
}

.database-tree-view {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.el-tree-node__content) {
  height: 32px;
  padding: 2px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}
</style>