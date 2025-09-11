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
  <el-tree :data="treeData"
   default-expand-all
   highlight-current
   @node-contextmenu="onContextMenu" >
  </el-tree>

    <!-- 右键菜单 -->
  <div
    v-if="menu.show"
    class="context-menu"
    :style="{ width: menu.width + 'px', height: menu.height + 'px', left: menu.left + 'px', top: menu.top + 'px' }"
    @mouseleave="menu.show = false"
  >
    <div class="item" @click="handleCreate('table')" v-if="menu.type === 'table'">
      新建表
    </div>
    <div class="item" @click="handleCreate('altertable')" v-if="menu.type === 'altertable'">
      修改表
    </div>
    <div class="item" @click="handleCreate('view')" v-if="menu.type === 'view'">
      新建视图
    </div>
  </div>

    <!-- 连接配置对话框 -->
    <ConnectionConfig
      v-model="showConnectionDialog"
      @connection-success="handleConnectionSuccess"
    />
  </div>

   <TableDesigner ref="designer" />
</template>

<script setup>
import { ref, onMounted,watch,reactive  } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ConnectionConfig from './ConnectionConfig.vue'
import { databaseApi } from '../api/api'
import { useConnStore } from '@/stores/conn'


import { useSqlStore } from '@/stores/sqlStore'
import { useTreeStore } from '@/stores/treeStore'
import TableDesigner from '@/components/TableDesigner.vue'
const connStore = useConnStore()
const sqlStore = useSqlStore()
const treeStore = useTreeStore()

const localData = ref({ sql: '', result: null })



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


const treeProps = {
  children: 'children',
  label: 'label'
}

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  currentConnection.value = connectionConfig
  loadDatabases()
}

// 加载数据库列表
const loadDatabases = async () => {

  //todo: 获取连接信息如果失败则把connStore.conn变null
  // console.log('loadDatabases connStore.conn',connStore.conn)
  currentConnection.value = connStore.conn
  
  // if (!currentConnection.value) return
  if (!connStore.conn) return

  try {
  const res = await databaseApi.getDatabases(connStore.conn)
  // 假设 res.data 就是 { databases:[], tableList:[], viewList:[] }
  if(res.code === 200) {
    // treeData.value = buildTree(res.data
    // console.log('tree res.data:', res.data)
    let tmpdb = []
    tmpdb.push(res.data.dbName)
    let dbdata = { databases: tmpdb, tableList: res.data.tableList, viewList: res.data.viewList }
    treeData.value = buildTree(dbdata)
  }
  } catch (e) {
    console.error(e)
    currentConnection.value = null
    ElMessage.error('连接失败:'+e)
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
          type: 'table',
          children: tableList.map(t => ({ label: t.tableName,type: 'altertable' }))
        },
        {
          label: '视图',
          type: 'view',
          children: viewList.map(v => ({ label: v.tableName }))
        }
      ]
    }
  ]
}

watch(
  () => treeStore.refreshTrigger,
  () => {
    // console.log('进tree了')
    loadDatabases() // ✅ 触发刷新
  }
)

defineExpose({
  loadDatabases
})


/* --------------------- 右键菜单 --------------------- */
// 右键菜单状态
const menu = reactive({
show: false,
left: 0,
top: 0,
type: null,
height:38,
width:100,
})


// 节点右键事件
function onContextMenu(event, data, node) {
    event.preventDefault(); // 阻止默认右键菜单
    
    // 使用鼠标事件的实际坐标
    menu.left = event.clientX;
    menu.top = event.clientY - 50;
    menu.show = true;
    
    if (data.type === 'table') {
        menu.type = 'table';
    } else if (data.type === 'view') {
        menu.type = 'view';
    } else if (data.type === 'altertable') {
        menu.type = 'altertable';
    } else {
        menu.type = null;
        menu.show = false;
    }
}

// 点击空白处关闭菜单
document.addEventListener('click', () => (menu.show = false))

/* --------------------- 业务动作 --------------------- */
function handleCreate(type) {
  menu.show = false
  if (type === 'table') {
    console.log('新建表逻辑')
    createTable()
  } else if (type === 'view') {
    console.log('新建视图逻辑')
  }else if(type === 'altertable'){
    console.log('修改表结构逻辑')
    alterTable();
  }

}


// 2. 拿到子组件实例
const designer = ref(null)

// 3. 调用暴露出来的方法
function createTable() {
  designer.value.openDialog() // 不传参 = 新建
}

function alterTable() {
  designer.value.openDialog() 
}

function editTable() {
  // 模拟“后端”查到的旧结构
  const oldTable = {
    name: 'user',
    comment: '用户表',
    fields: [
      { name: 'id', type: 'bigint', length: '0', notNull: true, primary: true, comment: '主键' },
      { name: 'username', type: 'varchar', length: '50', notNull: true, primary: false, comment: '账号' }
    ]
  }
  designer.value.openDialog(oldTable) // 传参 = 修改
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


.database-tree {
position: relative;
}


.context-menu {
position: absolute;
background: #dbd8d8;
border: 1px solid #ebe8e8;
box-shadow: 0 2px 6px rgba(0,0,0,0.15);
z-index: 9999;
min-width: 100px;
}


.context-menu .item {
padding: 8px 12px;
cursor: pointer;
}


.context-menu .item:hover {
background: #f5f5f5;
}
</style>
