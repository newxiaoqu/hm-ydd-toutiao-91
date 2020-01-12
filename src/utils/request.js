import axios from 'axios' // 引入axios插件
import JSONBig from 'json-bigint' // 处理大数组插件
import store from '@/store' // 引入vuex中的store实例
import { Store } from 'vuex'

// 创建一个axios实例，和原来的axios没关系
const instance = axios.create({
  // 构造参数
  baseURL: 'http://ttapi.research.itcast.cn/app/v1_0', // 设置请求地址常量
  transformRespones: [function (data) {
    // data是后端响应的字符串 默认的转化是JSON.parse 处理大数字是有问题的，需要用JSONBIG替换
    // return data ? JSONBig.parse(data):{}
    try {
      return JSONBig.parse(data)
    } catch (error) {
      return data
    }
  }]
})

// 请求拦截器
instance.interceptors.request.use(function (config) {
  // 应该在返回配置之前  网配置里面塞入token
  if (Store.state.user.token) {
    // 如果token存在，就要注入
    config.headers['Authorization'] = `Bearer  ${store.state.user.token}` // 统一注入token
  }
  // 配置信息
  return config
}, function (error) {
  return Promise.reject(error) // 直接返回promise错误
})

// 响应拦截器
instance.interceptors.response.user(function (response) {
  // 得到的response实际上被axios包一层数据
  try {
    // 将数据解构
    return response.data.data
  } catch {
    return response.data
  }
}, function (error) {
  // 错误的时候 token容易失效
  return Promise.reject(error)
})
export default instance // 导出request工具
