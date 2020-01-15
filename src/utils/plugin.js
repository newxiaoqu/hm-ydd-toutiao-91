export default {
  install (Vue) {
    // 插件
    Vue.prototype.$gnotify = (params) => Vue.prototype.$notify({ duration: 1000, ...params })
    Vue.prototype.$sleep = sleep // 封装一个休眠函数
  }
}
function sleep (time = 500) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => resolve(), time)
  })
}
