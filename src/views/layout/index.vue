<template>
  <div class="container">
    <van-nav-bar @click-right="$router.push('/search')" v-if="showNavBar" fixed title="黑马头条" right-text="搜索"></van-nav-bar>
    <div class="my-wrapper" :class="{ noTop:!showNavBar }">
      <!-- 如果想要缓存的二级路由组件的话 可以直接缓存二级路由容器 -->
      <!-- 如果缓存了这个容器  表示 这个容器下的所有的组件都会被缓存 -->
      <keep-alive>
        <!-- 用keep-alive包裹路由容器 -->
        <router-view></router-view>
      </keep-alive>

    </div>
    <van-tabbar route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/question" icon="chat-o">问答</van-tabbar-item>
      <van-tabbar-item to="/video" icon="video-o">视频</van-tabbar-item>
      <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script>
export default {
  name: 'layout',
  computed: {
    showNavBar () {
      return this.$route.path !== '/user'
    }
  }
}
</script>

<style lang="less" scoped>
.container{
  width: 100%;
  height: 100%;
  position: relative;
  .my-wrapper{
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding-top: 46px;
    padding-bottom: 50px;
    box-sizing: border-box;
    &.noTop{
      padding-top: 0;
    }
  }
}
</style>
