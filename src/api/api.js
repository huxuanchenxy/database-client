import axios from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT),
  headers: {
    'Content-Type': 'application/json'
  }
})

/* ------------ 全局 loading 逻辑 ------------ */
let loadingInstance = null
let requestCount = 0

function openLoading() {
  if (requestCount === 0) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: '加载中…',
      background: 'rgba(0,0,0,0.5)'
    })
  }
  requestCount++
}

function closeLoading() {
  requestCount--
  if (requestCount <= 0) {
    requestCount = 0
    loadingInstance?.close()
    loadingInstance = null
  }
}

// 请求拦截器
api.interceptors.request.use(
  config => {
    openLoading()
    return config
  },
  error => {
    closeLoading()
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    closeLoading()
    return response.data
  },
  error => {
    closeLoading()
    console.error('API错误:', error,import.meta.env.VITE_API_BASE_URL)
    return Promise.reject(error)
  }
)

// API方法
export const databaseApi = {
  // 测试连接
  testConnection: (connectionConfig) => {
    return api.post('/seisdb/getconn', connectionConfig)
  },

  // 保存连接配置
  saveConnection: (connectionConfig) => {
    return api.post('/connection/save', connectionConfig)
  },

  // 获取数据库列表
  getDatabases: (connectionConfig) => {
    return api.post('/seisdb/gettblist', connectionConfig)
  },

  // 获取表结构
  getTableInfo: (parms) => {
    return api.post('/seisdb/gettableinfo', parms)
  },

  // 执行SQL
  executeSql: (connectionConfig, sql) => {
    return api.post('/sql/execute', {
      connection: connectionConfig,
      sql: sql
    })
  },
  // 执行SQL
  executeSqlWithText: (parms) => {
    return api.post('/seisdb/exec', parms)
  },

  // 获取历史记录
  getHistory: () => {
    return api.get('/history/list')
  },

  // 保存历史记录
  saveHistory: (historyRecord) => {
    return api.post('/history/save', historyRecord)
  }

  ,
  //登录
  login: (parms) => {
    return api.post('/common/login', parms)
  }

  ,
  getdevicelist: (parms) => {
    return api.post('/device/getdevicelist', parms)
  }
  //获取所有配置信息,树结构
    ,
  getallconfiginfo: (parms) => {
    return api.post('/device/getallconfiginfo', parms)
  }
  //根据设备id获取所有点位
      ,
  getregisterbydeviceid: (parms) => {
    return api.post('/device/getregisterbydeviceid', parms)
  }
  //数据存储管理
        ,
  getallconfiginfolist: (parms) => {
    return api.post('/device/getallconfiginfolist', parms)
  }
  //数据存储管理带统计
  ,
  getallconfiginfotj: (parms) => {
    return api.post('/device/getallconfiginfotj', parms)
  }
  ,
  execconfig: (parms) => {
    return api.post('/device/execconfig', parms)
  }
  ,
  delconfig: (parms) => {
    return api.post('/device/delconfig', parms)
  }
    ,
  deldevice: (parms) => {
    return api.post('/device/deldevice', parms)
  },
  //设备新增修改接口
  execdevice: (parms) => {
    return api.post('/device/execdevice', parms)
  }
// 根据设备id获取全部点位
  ,getregister: (parms) => {
    return api.post('/device/getregister', parms)
  }

    ,getdatavalue: (parms) => {
    return api.post('/device/getdatavalue', parms)
  }
  
  
}

export default api