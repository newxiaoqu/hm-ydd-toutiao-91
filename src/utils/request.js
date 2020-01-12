import axios from 'axios' // 引入axios插件
import JSONBig from 'json-bigint' // 处理大数组插件
import store from '@/store' // 引入vuex中的store实例
import { Store } from 'vuex'
import router from '@/router'

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
  } catch (error) {
    return response.data
  }
}, async function (error) {
  // 错误的时候 token容易失效 处理token失效的问题
  // 如何判断失效
  // error=>config(当前请求的配置) request(请求)response(响应)
  if (error.response && error.response.status === 401) {
    let toPath = { path: '/login',
      query: {
        redirectUrl: router.currentRoute.path } } // 跳转对象

    // 表示token过期，先判断  是否有refresh_token
    if (store.state.user.refresh_token) {
      try {
        // 应该发送一个请求，换取新的token
        // 这里不应该再用instance 因为instance会再次进入拦截器  用默认的axios
        let result = await axios({
          method: 'put',
          url: 'http://ttapi.research.itcast.cn/app/v1_0/authorizations',
          headers: {
            Authorization: `Bearer ${store.state.user.refresh_token}`
          }
        })
        store.commit('updateUser', {
          user: {
            token: result.data.data.token, // 拿到新的token之后
            refresh_token: store.state.user.refresh_token // 将之前refresh_token  14天有效
          }
        })// 更新vuex的数据 也更新了本地缓存数据
        return instance(error.config) // 把刚才错误的请求再次发送出去  然后将promise返回
      } catch (error) {
        // 如果错误  表示补救措施也没用了，应该跳转到登录页，并且  把废掉的user全都干掉
        store.commit('clearUser') // 所有用户信息清空
        router.push(toPath) // 跳转到回登录页
      }
    } else {
      // 连refresh_token 都没有
      // 当访问页面时=>去登录=>登录成功之后=>回到之前的页面 记住当前的地址=>登录页面=>读取地址=>跳到地址
      // params  动态路由 user/:id
      // query传参  user?id=123
      // 获取当前页面地址
      router.push(toPath)
    }
  }
  return Promise.reject(error)
})
export default instance // 导出request工具
