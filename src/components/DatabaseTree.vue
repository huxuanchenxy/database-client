<template>
  <div class="database-tree">
    <div class="toolbar">
        <span class="title"></span>
    </div>
 <div class="tree-wrapper">
  <el-tree :data="treeData"
   default-expand-all
   highlight-current
   @node-contextmenu="onContextMenu" 
   @node-click="onNodeClick"
   class="treecss"
   >
   <template #default="{ data }">
     <div class="tree-node">
       <span>{{ data.label }}</span>
       <!-- 为连接根节点添加断开连接按钮 -->
       <el-button 
         v-if="data.type === 'connection'"
         type="danger" 
         size="small" 
         text
         @click.stop="handleDisconnectConnection(data)"
         class="disconnect-btn"
       >
         断开连接
       </el-button>
     </div>
   </template>
  </el-tree>
</div>
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
    <div class="item"  v-if="menu.type === 'altertable'">
        <div class="item" @click="handleCreate('altertable')">修改表</div>
        <div class="item" @click="handleCreate('selecttable')">打开表</div>
        <div class="item" @click="handleCreate('droptable')">删除表</div>
    </div>
    <div class="item" @click="handleCreate('view')" v-if="menu.type === 'view111'">
      新建视图
    </div>
    <div class="item"  v-if="menu.type === 'alterview'">
        <div class="item" @click="handleCreate('selectview')">打开视图</div>
    </div>
  </div>
  </div>

   <TableDesigner ref="designer" />
</template>

<script setup>
import { ref, onMounted,watch,reactive, nextTick  } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { databaseApi } from '@/api/api'
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
// 存储所有连接实例
const connections = ref([])


const treeProps = {
  children: 'children',
  label: 'label'
}

// 处理连接成功
const handleConnectionSuccess = async (connectionConfig) => {
  // console.log('=== DatabaseTree: 收到 connection-success 事件 ===')
  // console.log('=== DatabaseTree: handleConnectionSuccess 开始 ===')
  // console.log('=== DatabaseTree: 连接配置:', connectionConfig)
  // console.log('=== DatabaseTree: push前 connections.value:', connections.value)
  // console.log('=== DatabaseTree: push前 connections.value.length:', connections.value.length)
  
  // 总是添加新的连接实例（不管IP是否重复）
  // 从connectionConfig构建完整的连接实例，而不是依赖connStore.currentConnection
  const newConnection = {
    dbHost: `${connectionConfig.host}:${connectionConfig.port}`,
    dbName: connectionConfig.database,
    user: connectionConfig.username,
    password: connectionConfig.password,
    id: Date.now(), // Todo 临时ID，实际应该使用唯一标识
    connectionName: connectionConfig.name
  }
  
  // console.log('创建新连接实例:', newConnection)
  
  // 关键步骤：添加连接实例到本地数组
  connections.value.push(newConnection)
  
  // 同时添加到connStore中持久化存储
  connStore.addConnection(newConnection)
  
  // console.log('=== push 后立即检查 ===')
  // console.log('connections.value 长度:', connections.value.length)
  // console.log('connections.value 内容:', connections.value)
  // console.log('connStore.connections 长度:', connStore.connections.length)
  // console.log('connStore.connections 内容:', connStore.connections)
  
  currentConnection.value = newConnection
  
  // 移除 await nextTick()，避免时序问题
  // console.log('=== 准备调用 loadDatabases ===')
  
  try {
    await loadDatabases()
    console.log('loadDatabases 执行完成')
  } catch (error) {
    console.error('loadDatabases 执行出错:', error)
  }
  
  // 通知其他组件连接成功
  // console.log('=== 通知其他组件连接成功 ===')
  treeStore.triggerRefresh()
  console.log('=== handleConnectionSuccess 结束 ===')
}

// 加载数据库列表
const loadDatabases = async () => {
  // console.log('=== loadDatabases 开始 ===')
  // console.log('loadDatabases 被调用')
  // console.log('connections.value 长度:', connections.value.length)
  // console.log('connections.value 内容:', connections.value)
  // console.log('connections.value 内存地址:', connections.value)
  // console.log('当前时间戳:', Date.now())
  
  // 如果没有连接实例，清空树数据
  if (connections.value.length === 0) {
    console.log('=== 没有连接实例，清空树数据 ===')
    treeData.value = []
    console.log('=== loadDatabases 结束 (无连接) ===')
    return
  }

  // console.log('=== 开始处理连接实例 ===')
  // 构建树数据，支持多个连接实例
  const allTreeData = []
  
  // 为每个连接实例构建树
  for (const connection of connections.value) {
    // console.log(`处理连接: ${connection.connectionName}`)
    try {
      // 使用新的getDBlist接口获取数据库列表
      const res = await databaseApi.getDBlist(connection)
      // console.log(`连接 ${connection.connectionName} 的数据库列表:`, res)
      if (res.code === 200) {
        const connectionTreeData = buildTreeForConnectionWithDBList(res.data, connection)
        allTreeData.push(connectionTreeData)
      } else {
        // console.error('获取数据库列表失败:', res.message)
        // 即使失败，也添加一个空的连接节点
        allTreeData.push({
          label: connection.connectionName,
          type: 'connection',
          connectionId: connection.id,
          dbHost: connection.dbHost,
          children: []
        })
      }
    } catch (e) {
      console.error('连接数据库失败:', e)
      // 即使失败，也添加一个空的连接节点
      allTreeData.push({
        label: connection.connectionName,
        type: 'connection',
        connectionId: connection.id,
        dbHost: connection.dbHost,
        children: []
      })
    }
  }
  
  // console.log('准备更新树数据:', allTreeData)
  treeData.value = allTreeData
  // console.log('最终树数据:', treeData.value)
  
  // 等待Vue更新DOM
  await nextTick()
  // console.log('=== loadDatabases 结束 ===')
}

// 根据数据库列表构建树结构
function buildTreeForConnectionWithDBList(dbList, connection) {
  // console.log(`构建 ${connection.connectionName} 的树结构，数据库列表:`, dbList)
  
  // 确保dbList是数组
  const safeDbList = Array.isArray(dbList) ? dbList : []
  
  const treeNode = {
    label: connection.connectionName,
    type: 'connection',
    connectionId: connection.id,
    dbHost: connection.dbHost,
    children: safeDbList.map(dbName => ({
      label: dbName,
      type: 'database',
      dbName: dbName,
      connectionId: connection.id,
      connection: connection,
      children: [], // 初始为空，双击时加载表和视图
      isLoaded: false // 标记是否已加载表和视图
    }))
  }
  
  // console.log(`${connection.connectionName} 的树节点:`, treeNode)
  return treeNode
}

onMounted(async () => {
  // 组件挂载时的初始化逻辑
  // console.log('=== 组件挂载开始 ===')
  // console.log('组件挂载时间:', new Date().toLocaleTimeString())
  // console.log('初始 connections.value:', connections.value)
  // console.log('初始 connections.value.length:', connections.value.length)
  // console.log('connStore.connections 数量:', connStore.connections.length)
  // console.log('connStore.connections:', connStore.connections)
  
  // 从 connStore 恢复所有连接实例
  if (connStore.connections.length > 0) {
    // console.log('从 connStore 恢复所有连接实例')
    connections.value = [...connStore.connections]
    currentConnection.value = connStore.currentConnection || null
    // console.log('恢复后 connections.value:', connections.value)
    // console.log('恢复后 connections.value.length:', connections.value.length)
  } else {
    // console.log('没有持久化的连接信息')
    // 检查是否有旧版本的conn数据
    const oldConnData = localStorage.getItem('conn')
    if (oldConnData) {
      try {
        const oldConn = JSON.parse(oldConnData)
        if (oldConn.dbHost) {
          // console.log('检测到旧版本连接数据，正在迁移:', oldConn)
          // 创建一个新的连接实例，使用IP作为默认连接名称
          const migratedConnection = {
            ...oldConn,
            id: Date.now(),
            connectionName: oldConn.dbHost // 使用IP作为默认连接名称
          }
          connections.value.push(migratedConnection)
          connStore.addConnection(migratedConnection)
          // 清理旧数据
          localStorage.removeItem('conn')
        }
      } catch (e) {
        // console.error('迁移旧连接数据失败:', e)
      }
    }
  }
  
  await nextTick()
  // console.log('=== 组件挂载完成，准备初始化树 ===')
  loadDatabases()
  // console.log('=== 组件挂载结束 ===')
})

/* 1. 先给空数组，树第一次渲染不会报错 */
const treeData = ref([])

/* 为每个连接实例构建树结构 */
function buildTreeForConnection(dbData, connection) {
  // console.log(`构建 ${connection.connectionName} 的树结构，原始数据:`, dbData)
  
  // 确保数据结构正确
  const dbName = dbData.dbName || dbData.database || '未知数据库'
  const tableList = dbData.tableList || []
  const viewList = dbData.viewList || []
  
  const treeNode = {
    label: connection.connectionName,
    type: 'connection',
    connectionId: connection.id,
    dbHost: connection.dbHost,
    children: [
      {
        label: dbName,
        type: 'database',
        children: [
          {
            label: '表',
            type: 'table',
            children: tableList.map(t => ({ 
              label: t.tableName || t.name || '未知表名', 
              type: 'altertable' 
            }))
          },
          {
            label: '视图',
            type: 'view',
            children: viewList.map(v => ({ 
              label: v.tableName || v.name || '未知视图名', 
              type: 'alterview' 
            }))
          }
        ]
      }
    ]
  }
  
  // console.log(`${connection.connectionName} 的树节点:`, treeNode)
  return treeNode
}

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
          children: viewList.map(v => ({ label: v.tableName,type: 'alterview' }))
        }
      ]
    }
  ]
}

watch(
  () => treeStore.refreshTrigger,
  () => {
    console.log('进tree了')
    loadDatabases() // ✅ 触发刷新
  }
)

// 监听connections数组变化，立即更新树
watch(connections, (newConnections, oldConnections) => {
  // console.log('=== Watcher 触发 ===')
  // console.log('触发时间:', new Date().toLocaleTimeString())
  // console.log('旧值:', oldConnections)
  // console.log('旧值长度:', oldConnections ? oldConnections.length : 'undefined')
  // console.log('新值:', newConnections)
  // console.log('新值长度:', newConnections.length)
  // console.log('新值内容:', newConnections)
  // console.log('是否相等:', oldConnections === newConnections)
  // console.log('内存地址检查:', {
  //   new: newConnections, 
  //   ref: connections.value,
  //   equal: newConnections === connections.value 
  // })
  
  if (newConnections.length > 0) {
    console.log('=== Watcher 调用 loadDatabases ===')
    loadDatabases()
  } else {
    console.log('=== Watcher 清空树数据 ===')
    treeData.value = []
  }
  console.log('=== Watcher 结束 ===')
}, { deep: true })

defineExpose({
  loadDatabases,
  handleConnectionSuccess
})


/* --------------------- 右键菜单 --------------------- */
// 右键菜单状态
const menu = reactive({
show: false,
left: 0,
top: 0,
type: null,
height:76, // 增加了高度，因为添加了新的菜单项
width:100,  // 增加了宽度
})

const currentNode = ref(null)
// 节点右键事件
function onContextMenu(event, data, node) {
    event.preventDefault(); // 阻止默认右键菜单
    currentNode.value = node;
    // 使用鼠标事件的实际坐标
    menu.left = event.clientX;
    menu.top = event.clientY;
    menu.show = true;
    
    if (data.type === 'connection') {
        // 连接根节点右键菜单
        menu.type = 'connection';
    } else if (data.type === 'table') {
        menu.type = 'table';
    } else if (data.type === 'view') {
        menu.type = 'view';
    } else if (data.type === 'altertable') {
        menu.type = 'altertable';
    } else if (data.type === 'alterview') {
        menu.type = 'alterview';
    } else {
        menu.type = null;
        menu.show = false;
    }
    emit('table-selected', data)
}

function onNodeClick(data, node) {
  emit('table-selected', data)
  
  // 当点击数据库节点时，更新当前连接的dbName
  if (data.type === 'database') {
    // 更新当前连接的dbName为当前数据库的dbName
    const updatedConnection = {
      ...data.connection,
      dbName: data.dbName
    }
    
    // 更新connStore中的当前连接
    connStore.currentConnection = updatedConnection
    currentConnection.value = updatedConnection
    
    // 双击数据库节点时加载表和视图
    if (!data.isLoaded) {
      loadTablesAndViews(data, node)
    }
  }
}

// 加载数据库的表和视图
async function loadTablesAndViews(databaseNode, treeNode) {
  // console.log(`加载数据库 ${databaseNode.label} 的表和视图`)
  
  // 更新节点状态为加载中
  treeNode.loading = true
  
  try {
    // 调用原来的getDatabases接口，注意需要修改connection对象，设置正确的dbName
    const connectionConfig = {
      ...databaseNode.connection,
      dbName: databaseNode.dbName
    }
    
    const res = await databaseApi.getDatabases(connectionConfig)
    // console.log(`数据库 ${databaseNode.label} 的表和视图:`, res)
    
    if (res.code === 200) {
      // 构建表和视图的树结构
      const tableList = res.data.tableList || []
      const viewList = res.data.viewList || []
      
      const updatedChildren = [
        {
          label: '表',
          type: 'table',
          children: tableList.map(t => ({
            label: t.tableName || t.name || '未知表名',
            type: 'altertable'
          }))
        },
        {
          label: '视图',
          type: 'view',
          children: viewList.map(v => ({
            label: v.tableName || v.name || '未知视图名',
            type: 'alterview'
          }))
        }
      ]
      
      // 更新节点数据
      databaseNode.children = updatedChildren
      databaseNode.isLoaded = true
      
      // 重新设置树数据以触发更新
      treeData.value = [...treeData.value]
    } else {
      // console.error('获取表和视图失败:', res.message)
      ElMessage.error('获取表和视图失败: ' + res.message)
    }
  } catch (e) {
    console.error('加载表和视图失败:', e)
    ElMessage.error('加载表和视图失败: ' + e.message)
  } finally {
    // 取消加载状态
    treeNode.loading = false
  }
}

// 点击空白处关闭菜单
document.addEventListener('click', () => (menu.show = false))

/* --------------------- 业务动作 --------------------- */
function handleCreate(type) {
  menu.show = false
  if (type === 'table') {
    // console.log('新建表逻辑')
    createTable()
  } else if (type === 'view') {
    // console.log('新建视图逻辑')
  }else if(type === 'altertable'){
    // console.log('修改表结构逻辑')
    alterTable();
  }else if(type === 'selecttable'){
    // console.log('打开表逻辑')
    selectTable();
  }else if(type === 'droptable'){
    // console.log('删除表逻辑')
    dropTable();
  }else if(type === 'selectview'){
    // console.log('selectview')
    selectTable('view');
  }else if(type === 'connection'){
    // 连接节点的右键菜单逻辑
    handleDisconnectConnection(currentNode.value.data);
  }

}


// 2. 拿到子组件实例
const designer = ref(null)

// 3. 调用暴露出来的方法
function createTable() {
  designer.value.openDialog() // 不传参 = 新建
}

function alterTable() {
  let currrenttable = currentNode.value.data.label
  designer.value.openDialog(currrenttable) 
}


const dropTable = async()=> {
  try {
    let currrenttable = currentNode.value.data.label
    
    await ElMessageBox.confirm(
      '确定要删除这张表 ('+ currrenttable+') 吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // console.log('执行删除表逻辑')
    
    let sql = `DROP TABLE ${currrenttable}`
    const parm = {
      ...currentConnection.value,
      oprationString: sql, // 确保 cleanedSql 是 DROP TABLE xxx
    }
    // console.log('parm:', parm)
    const res = await databaseApi.executeSqlWithText(parm)

    if (res.code === 200) {
      ElMessage.success('删除表成功')
      await loadDatabases() // 刷新树
    } else {
      ElMessage.error('删除失败：' + res.message)
    }
  } catch {
    // ✅ 用户点击“取消”
    console.log('取消删除')
  }
}


const selectTable = async(type = 'table')=> {
  let currrenttable = currentNode.value.data.label
  let sql = ' SELECT * FROM ' + currrenttable + '  '
  sqlStore.setResult(sql, currrenttable,type)
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


const handleDisconnect = () => {
  connStore.clearAllConnections()          // 1. 清空持久化数据
  currentConnection.value = null // 2. 清空本地响应式状态
  connections.value = []         // 3. 清空所有连接实例
  treeData.value = []            // 4. 清空左侧树
  treeStore.triggerRefresh()
  ElMessage.success('已断开数据库连接')
}

// 断开特定连接的函数
const handleDisconnectConnection = (connectionData) => {
  menu.show = false // 关闭右键菜单
  
  // 从connections数组中移除该连接
  const index = connections.value.findIndex(conn => conn.id === connectionData.connectionId)
  if (index !== -1) {
    connections.value.splice(index, 1)
  }
  
  // 同时从connStore中移除该连接
  connStore.removeConnection(connectionData.connectionId)
  
  // 检查是否断开的是当前活跃连接
  const isCurrentConnection = currentConnection.value && currentConnection.value.id === connectionData.connectionId
  
  // 如果断开的是当前活跃连接，更新currentConnection
  if (isCurrentConnection) {
    if (connections.value.length > 0) {
      // 如果还有其他连接，更新为第一个连接
      currentConnection.value = connections.value[0]
    } else {
      // 如果没有其他连接，清空当前连接
      currentConnection.value = null
    }
  }
  
  // 重新构建树数据
  loadDatabases()
  treeStore.triggerRefresh()
  ElMessage.success(`已断开连接: ${connectionData.label}`)
}

</script>

<style scoped>
.database-tree {
  /* height: 510px; */
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.tree-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    padding-top: 10px;
}

.connection-info {
line-height: 1;
margin-top: 8px;
}

/* 圆点公共样式 */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.green  { background: #67c23a; }   
.yellow { background: #e6a23c; }   

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
  flex: 1;
}

.disconnect-btn {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 6px;
  height: 18px;
  line-height: 1;
}

.disconnect-btn:hover {
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
}


.database-tree {
position: relative;
}


.context-menu {
position: fixed;
z-index: 9999;
}


.context-menu .item {
  cursor: pointer;
  background: #f0e9e9;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  height: 30px;
  line-height: 30px;
  text-align: center;
}


.context-menu .item:hover {
  background-color: #f0f0f0;
}

.context-menu .item:last-child {
  border-bottom: none;
}

.tree-wrapper {
  /* height: 400px;           */
  overflow: auto;         /* 超出时出现滚动条 */
  border: 1px solid #dcdfe6; /* 可选，美观 */
}

.toolbar {
  display: flex;
  top:0px;
}

.title{
  left:3%;
  position: relative;
}

.treecss
{
  --el-tree-node-hover-bg-color: #DCE7FF;   /* 悬停 */
  --el-tree-node-current-bg-color: #bae7ff; /* 当前选中 */
}
</style>