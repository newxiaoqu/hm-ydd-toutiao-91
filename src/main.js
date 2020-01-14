import Vue from 'vue'
import Vant from 'vant'

import 'vant/lib/index.less'
import '@/styles/index.less'

import plugin from '@/utils/plugin'
import App from './App.vue'
import router from './permission/router'
import store from './store'
import 'amfe-flexible'
Vue.use(Vant)
Vue.use(plugin)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
