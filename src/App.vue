<template>
  <div id="app">
    <keep-alive>
      <!-- 里面是当需要缓存时 -->
    <router-view v-if="$route.meta.isAlive"/>
    </keep-alive>
    <!-- 外面是不需要缓存时 -->
    <router-view v-if="!$route.meta.isAlive"/>

  </div>
</template>

<style lang="less">

</style>
