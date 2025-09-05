import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://10.89.33.97:9080', 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // console.log('发送请求:', config)
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API错误:', error)
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
    return api.post('/database/list', connectionConfig)
  },

  // 获取表列表
  getTables: (connectionConfig) => {
    return api.post('/table/list', connectionConfig)
  },

  // 执行SQL
  executeSql: (connectionConfig, sql) => {
    return api.post('/sql/execute', {
      connection: connectionConfig,
      sql: sql
    })
  },

  // 获取历史记录
  getHistory: () => {
    return api.get('/history/list')
  },

  // 保存历史记录
  saveHistory: (historyRecord) => {
    return api.post('/history/save', historyRecord)
  }
}

export default api