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
          已连接: {{ currentConnection.dbHost }}
        </el-tag>
      </div>
    </div>

    <el-divider />

    <!-- <el-tree
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
    </el-tree> -->
  <el-tree :data="treeData" default-expand-all >
  </el-tree>

    <!-- 连接配置对话框 -->
    <ConnectionConfig
      v-model="showConnectionDialog"
      @connection-success="handleConnectionSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ConnectionConfig from './ConnectionConfig.vue'
import { databaseApi } from '../api/api'
import { useConnStore } from '@/stores/conn'

const connStore = useConnStore()
const props = defineProps({
  onDatabaseSelect: Function,
  onTableSelect: Function
})

const emit = defineEmits(['database-selected', 'table-selected'])

const showConnectionDialog = ref(false)
const treeRef = ref()
const currentConnection = ref(null)
// const treeData = ref([])
const loading = ref(false)

// 模拟数据库API
const mockDatabaseApi = {
  // 模拟获取数据库列表
  getDatabases: async (connectionConfig) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      data: {
        databases: ['test_db', 'user_management', 'order_system']
      }
    }
  },

  // 模拟获取数据库对象 (表、视图、存储过程、函数)
  getDatabaseObjects: async ({ database }) => {
    await new Promise(resolve => setTimeout(resolve, 300))

    const dbMock = {
      seis: {
        tables: ['users', 'orders', 'products'],
        views: ['active_users', 'order_summary'],
        procedures: ['sp_update_order', 'sp_recalc_stock'],
        functions: ['fn_get_discount', 'fn_format_date']
      },
      user_management: {
        tables: ['users', 'roles', 'permissions'],
        views: ['user_roles_view'],
        procedures: ['sp_add_user', 'sp_delete_user'],
        functions: ['fn_user_count']
      },
      order_system: {
        tables: ['orders', 'order_items', 'customers'],
        views: ['order_summary_view'],
        procedures: ['sp_create_order', 'sp_cancel_order'],
        functions: ['fn_order_total']
      }
    }

    return {
      success: true,
      data: dbMock[database] || { tables: [], views: [], procedures: [], functions: [] }
    }
  }
}

const treeProps = {
  children: 'children',
  label: 'label'
}

// 构建树形数据（数据库 -> [表、视图、存储过程、函数]）
const buildTreeData = (data) => {
  console.log('数据:', data)
  const tree = []
  let tmpdb = []
  tmpdb.push(data.dbName)
  data.databases = tmpdb //特殊结构
  // console.log('data.database', data.database.length)
  if (data.databases && data.databases.length > 0) {
    data.databases.forEach(db => {
      // console.log('db:', db)
      tree.push({
        id: `db_${db}`,
        label: db,
        icon: 'Database',
        type: 'database',
        database: db,
        connection: currentConnection.value,
        children: [
          { id: `db_${db}_tables`, label: '表', type: 'tables', icon: 'Folder', database: db, children: data.tableList },
          { id: `db_${db}_views`, label: '视图', type: 'views', icon: 'Folder', database: db, children: data.viewList },
          { id: `db_${db}_procs`, label: '存储过程', type: 'procedures', icon: 'Folder', database: db, children: [] },
          { id: `db_${db}_funcs`, label: '函数', type: 'functions', icon: 'Folder', database: db, children: [] }
        ]
      })
    })
  }
  // console.log('tree:', tree)
  return tree
}

// 点击节点加载子项
const handleNodeClick = async (data) => {
  console.log('点击节点:', data)
  console.log('treeData.value:', treeData.value)
  if (['tables', 'views', 'procedures', 'functions'].includes(data.type)) {
    try {
      loading.value = true
      ElMessage.info(`正在加载 ${data.label}...`)

      const result = await mockDatabaseApi.getDatabaseObjects({
        database: data.database
      })
      console.log('result:', result)

      if (result.success) {
        let list = result.data[data.type] || []
        console.log('list:', list)
        data.children = list.map(item => ({
          id: `${data.type}_${data.database}_${item}`,
          label: item,
          icon: 'Document',
          type: 'object',
          database: data.database,
          objectType: data.type,
          name: item
        }))
        console.log('data.children:', data.children)
        treeRef.value.updateKeyChildren(data.id, data.children)
        ElMessage.success(`加载 ${data.label} 成功，共 ${list.length} 个`)
      }
      // if (result.success) {
      //   let list = result.data[data.type] || []
      //   console.log('list:', list)
      //   data.children = list.map(item => ({
      //     id: `${data.type}_${data.database}_${item}`,
      //     label: item,
      //     icon: 'Document',
      //     type: 'object',
      //     database: data.database,
      //     objectType: data.type,
      //     name: item
      //   }))
      //   treeRef.value.updateKeyChildren(data.id, data.children)
      //   ElMessage.success(`加载 ${data.label} 成功，共 ${list.length} 个`)
      // }
    } catch (e) {
      ElMessage.error('加载失败: ' + e.message)
    } finally {
      loading.value = false
    }
  } else if (data.type === 'object') {
    // 点击具体对象（表/视图/函数）
    if (props.onTableSelect) {
      props.onTableSelect(data)
    }
    emit('table-selected', data)
  }
}

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  currentConnection.value = connectionConfig
  loadDatabases()
}

// 加载数据库列表
const loadDatabases = async () => {

  //todo: 获取连接信息如果失败则把connStore.conn变null
  // console.log('connStore.conn',connStore.conn)
  currentConnection.value = connStore.conn
  // console.log('当前连接:', currentConnection.value)
  // if (!currentConnection.value) return
  if (!connStore.conn) return

  try {
  const res = await databaseApi.getDatabases(connStore.conn)
  console.log('res',res)
  // 假设 res.data 就是 { databases:[], tableList:[], viewList:[] }
  if(res.code === 200) {
    // treeData.value = buildTree(res.data
    let tmpdb = []
    tmpdb.push(res.data.dbName)
    let dbdata = { databases: tmpdb, tableList: res.data.tableList, viewList: res.data.viewList }
    treeData.value = buildTree(dbdata)
  }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
  loadDatabases()
})

/* 1. 先给空数组，树第一次渲染不会报错 */
const treeData = ref([])

/* 2. 把后端数据 -> el-tree 结构 */
function buildTree({ databases, tableList, viewList }) {
  return [
    {
      label: databases[0],
      children: [
        {
          label: '表',
          children: tableList.map(t => ({ label: t.tableName }))
        },
        {
          label: '视图',
          children: viewList.map(v => ({ label: v.tableName }))
        }
      ]
    }
  ]
}


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
  max-height: calc(100vh - 120px); /* 减去顶部按钮和间距 */
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
