<template>
  <!-- 这里注意 这个div设置了滚动条 目的是 给后面做 阅读记忆 留下伏笔 -->
  <!-- 阅读记忆 => 看文章看到一半 滑到中部 去了别的页面 当你回来时 文章还在你看的位置 -->
  <div ref="myScroll" class="scroll-wrapper" @scroll="remember">
    <van-pull-refresh v-model="downLoading" @refresh="onRefresh" :success-text="refreshSuccessText">
      <van-list v-model="upLoading" :finished="finished" @load="onLoad" finished-text="不能再给你太多了">
        <van-cell :to="`/article?articleId=${article.art_id.toString()}`" v-for="article in articles" :key="article.art_id.toString()">
          <div class="article_item">
            <h3 class="van-ellipsis">{{ article.title }}</h3>
            <!-- 三图 -->
            <div class="img_box" v-if="article.cover.type===3">
              <van-image lazy-load class="w33" fit="cover" src="article.cover.images[0]" />
              <van-image lazy-load class="w33" fit="cover" src="article.cover.images[1]" />
              <van-image lazy-load class="w33" fit="cover" src="article.cover.images[2]" />
            </div>
            <!-- 单图 -->
            <div class="img_box" v-else-if="article.cover.type===1">
              <van-image lazy-load class="w100" fit="cover" src="article.cover.images[0]" />
            </div>
            <div class="info_box">
              <span>{{ article.aut_name }}</span>
              <span>{{ article.comm_count }}评论</span>
              <!-- 使用过滤器 -->
              <span>{{ article.pubdate | relTime }}</span>
              <!-- 点击叉号  要告诉父组件，我要反馈 -->
              <span class="close" v-if="user.token" @click.stop="$emit('showMoreAction',article.art_id.toString())">
                <van-icon name="cross"></van-icon>
              </span>
            </div>
          </div>
        </van-cell>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script>
import { getArticles } from '@/api/article'
import { mapState } from 'vuex'
import eventBus from '@/utils/eventBus'
export default {
  name: 'article-list',
  computed: {
    ...mapState(['user'])
  },
  data () {
    return {
      upLoading: false, // 是否加载数据
      finished: false, // 加载是否完成
      articles: [], // 定义一个数组
      refreshSuccessText: '更新成果', // 文本
      downLoading: false, // 是否开启下拉刷新
      timestamp: null, // 定义一个时间戳，这个时间戳用来告诉服务器现在我要求什么样的时间的数据
      scrollTop: 0 // 记录滚动的位置
    }
  },
  props: {
    channel_id: {
      type: Number, // 指定要传的props的类型
      required: true, // 要求props必须穿
      default: null // 给props一个默认值
    }
  },
  created () {
    // 开启监听
    eventBus.$on('delArticle', (articleId, channelId) => {
      if (this.channel_id === channelId) {
        // 这个条件表示，该列表就是当前激活的列表
        let index = this.articles.findIndex(item => item.art_id.toString() === articleId) // 查找对应的文章
        // 如果index大于-1表示找到了就要删除
        if (index > -1) {
          this.articles.splice(index, 1) // 删除不喜欢的文章
        }
      }
    })
    // 开启一个新的监听 监听当前tab切换的事件
    eventBus.$on('changeTab', id => {
      // 判断一个id是否等于 该组件通过props得到的频道id
      if (id === this.channel_id) {
        // 如果相等 说明找对了article-list实例
        // 因为article-list是有多个的
        // 为什么这里没有滚动呢？
        // 是因为切换事件之后 会执行 dom 更新 => dom的更新是异步的
        // 如果保证自己 在上一次完整页面渲染更新之后 执行逻辑
        // this.$nextTick=>会在数据  响应式之后 页面渲染完毕之后执行
        // this.$nextTick会保证在changeTab动作切换完成并且完成界面渲染之后执行
        this.$nextTick(() => {
          if (this.scrollTop && this.$refs.myScroll) {
            // 表示该文章列表是存在滚动的
            this.$refs.myScroll.scrollTop = this.scrollTop
          }
        })
      }
    })
  },
  methods: {
    // // 记录滚动的位置
    remember (event) {
      this.scrollTop = event.target.scrollTop
    },
    // 上拉加载
    async onLoad () {
      await this.$sleep()
      // 加载方法
      //   setTimeout(() => {
      //     if (this.articles.length === 50) {
      //       // 停止追加
      //       this.finished = true
      //     } else {
      //       let arr = Array.from(
      //         Array(10),
      //         (value, index) => index + this.articles.length + 1
      //       )
      //       this.articles.push(...arr) // 把生成的数据追加到末尾
      //       this.upLoading = false // 关闭状态
      //     }
      //   }, 1000)
      let data = await getArticles({ channel_id: this.channel_id, timestamp: this.timestamp || Date.now() })
      // 追加数据到队尾
      this.articles.push(...data.results)
      // 关闭加载状态
      this.upLoading = false
      if (data.pre_timestamp) {
        // 如果有
        this.timestamp = data.pre_timestamp
      } else {
        this.finished = true // 没有数据了
      }
    },
    async onRefresh () {
      await this.$sleep() // 等待sleep  resolve
      // 触发下拉刷新
      //   console.log('下拉刷新')
      //   setTimeout(() => {
      //     let arr = Array.from(Array(10), (value, index) => '追加' + (index + 1))
      //     this.articles.unshift(...arr) // 将数据添加到队首
      //     this.downLoading = false // 关掉下拉状态
      //     this.refreshSuccessText = `更新了 ${arr.length}条数据`
      //   }, 1000)
      // 下拉加载永远拉取的是最新的数据
      const data = await getArticles({ channel_id: this.channel_id, timestamp: Date.now() })
      this.downLoading = false // 关掉下拉状态
      // 有可能  最新没有推荐数据
      if (data.results.length) {
        // 如果长度大于0 表示有数据
        this.articles = data.results // 将历史数据全都覆盖掉了
        // 假如你之前已经将 上啦加载设置成finished设置成true
        // 表示我们换需要继续往下拉  就需要把原来的状态再次打开
        this.finished = false
        // 注意我们依然㤇获取此次的历史时间戳
        this.timestamp = data.pre_timestamp // 赋值历史时间戳  因为当你下拉刷新之后，上啦加载的时候要用到这个历史时间戳
        this.refreshSuccessText = `更新了 ${data.results.length}条数据`
      } else {
        // 如果没有数据更新  什么都不需要变化
        this.refreshSuccessText = '已是最新数据'
      }
    }

  },
  // 激活函数  当组件被keep-alive包裹 keep-alive=>router-view=>home=>article-list
  activated () {
    // console.log(this.scrollTop)
    // 唤醒的时候 需要 把记录的位置 回复回去
    // 需要在组件重新激活的时候  重新 设置原来的滚动条
    // 怎么滚回去
    console.log(this.$refs.myScroll)
    if (this.scrollTop && this.$refs.myScroll) {
      // 当滚动距离 不为0 且dom元素存在的情况下 才去做滚动
      this.$refs.myScroll.scrollTop = this.scrollTop // 将原来记录的位置赋值给dom元素
    }
  }
}
</script>

<style lang="less" scoped>
.article_item {
  h3 {
    font-weight: normal;
    line-height: 2;
  }
  .img_box {
    display: flex;
    justify-content: space-between;
    .w33 {
      width: 33%;
      height: 90px;
    }
    .w100 {
      width: 100%;
      height: 180px;
    }
  }
  .info_box {
    color: #999;
    line-height: 2;
    position: relative;
    font-size: 12px;
    span {
      padding-right: 10px;
      &.close {
        border: 1px solid #ddd;
        border-radius: 2px;
        line-height: 15px;
        height: 12px;
        width: 16px;
        text-align: center;
        padding-right: 0;
        font-size: 8px;
        position: absolute;
        right: 0;
        top: 7px;
      }
    }
  }
}
</style>
