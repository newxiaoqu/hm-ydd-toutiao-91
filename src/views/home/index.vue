<template>
  <div class="container">
    <van-tabs v-model="activeIndex" swipeable>
      <van-tab :title="channel.name" v-for="channel in channels" :key="channel.id">
        <!-- 这里注意 这个div设置了滚动条 目的是 给后面做 阅读记忆 留下伏笔 -->
        <!-- 阅读记忆 => 看文章看到一半 滑到中部 去了别的页面 当你回来时 文章还在你看的位置 -->
        <article-list @showMoreAction="openMoreAction" :channel_id="channel.id"></article-list>
      </van-tab>
    </van-tabs>
    <!-- 显示编辑频道的图标 -->
    <span class="bar_btn" @click="showChannelEdit=true">
      <van-icon name="wap-nav" />
    </span>
    <!-- 放置弹层 -->
    <van-popup :style="{width:'80%'}" v-model="showMoreAction">
      <!-- 包裹反馈组件 -->
      <!-- reports事件中的第一个参数$event实际上就是moreAction组件传出的type -->
      <more-action @dislike="dislikeOrReport($event,'dislike')" @reports="dislikeOrReport($event,'report')"></more-action>
    </van-popup>
    <!-- 编辑频道 -->
    <van-action-sheet :round=false title="编辑频道" v-model="showChannelEdit">
      <!-- 放置频道编辑组件 -->
      <channel-edit @delChannel="delChannel"
      :activeIndex="activeIndex"
       @selectChannel="selectChannel"
        :channels= 'channels'>
      </channel-edit>
    </van-action-sheet>
  </div>
</template>

<script>
import ArticleList from './components/article-list'
import { getMyChannels, delChannel } from '@/api/channels'
import MoreAction from './components/more-action'
import { disLikeArticle, reportArticle } from '@/api/article.js'
import eventBus from '@/utils/eventBus'
import ChannelEdit from './components/channel-edit'
export default {
  name: 'home',
  data () {
    return {
      activeIndex: 0, // 默认启动索引为0的标签
      channels: [], // 频道需要的数据
      showMoreAction: false, // 用来控制显示反馈弹层
      articleId: null, // 定义一个值接收
      showChannelEdit: false // 设置频道编辑的显示或者隐藏
    }
  },
  // 注册组件
  components: {
    ArticleList,
    MoreAction,
    ChannelEdit
  },
  methods: {
    async getMyChannels () {
      let data = await getMyChannels()
      this.channels = data.channels // 更新原来的channels
    },
    // 监听子组件触发的事件，打开弹层
    openMoreAction (artId) {
      this.showMoreAction = true // 打开弹层
      this.articleId = artId // 接收不喜欢文章的id
    },
    // 调用不喜欢文章的接口
    // async dislike () {
    //   try {
    //     await disLikeArticle({ target: this.articleId })
    //     this.$gnotify({ type: 'success', message: '操作成功' })
    //     // 触发一个时间，发出广播，听到广播的文章列表 去删除对应的数据
    //     // 文章id  频道id
    //     eventBus.$emit('delArticle', this.articleId, this.channels[this.activeIndex].id)
    //     this.showMoreAction = false // 关闭弹层
    //   } catch (error) {
    //     this.$gnotify({ type: 'danger', message: '操作失败' })
    //   }
    // },
    // 调用举报文章的接口
    // async report (type) {
    //   try {
    //     await reportArticle({ target: this.articleId, type })
    //     this.$gnotify({ type: 'success', message: '操作成功' })
    //     eventBus.$emit('delArticle', this.articleId, this.channels[this.activeIndex].id)
    //     this.showMoreAction = false // 关闭弹层
    //   } catch (error) {
    //     this.$gnotify({ type: 'danger', message: '操作失败' })
    //   }
    // },
    // 不喜欢或者举报
    async dislikeOrReport (params, operatetype) {
      try {
        if (this.articleId) {
          operatetype === 'dislike' ? await disLikeArticle({
            target: this.articleId
          }) : await reportArticle({ target: this.articleId, type: params })
          this.$gnotify({ type: 'success', message: '操作成功' })
          eventBus.$emit('delArticle', this.articleId,
            this.channels[this.activeIndex].id)
          this.showMoreAction = false
        }
      } catch (error) {
        this.$gnotify({ type: 'danger', message: '操作失败' })
      }
    },
    // 切换到对应的频道关闭弹层
    selectChannel (id) {
      let index = this.channels.findIndex(item => item.id === id) // 获取切换频道的索引
      this.activeIndex = index // 将tabs激活标签切换到对应的标签下
      this.showChannelEdit = false // 关闭弹层
    },
    // 删除频道的方法
    async delChannel (id) {
      try {
        await delChannel(id) // 表示删除数据成功d
        // 要移除自身data中channels中的数据
        let index = this.channels.findIndex(item => item.id === id) // 找到删除的索引
        if (index <= this.activeIndex) {
          // 如果删除的频道在当前激活频道之前或者就是当前激活频道
          // 要把我们的激活索引往前挪一位
          this.activeIndex = this.activeIndex - 1
        }
        if (index > -1) {
          // 如果大于-1
          this.channels.splice(index, 1) // 移除当前频道
        }
      } catch (error) {
        this.$gnotify({ type: 'danger', message: '删除频道失败' })
      }
    }
  },
  created () {
    this.getMyChannels()
  }
}
</script>

<style lang="less" scoped>
.van-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  /deep/ .van-tabs__wrap {
    height: 36px;
    padding-right: 36px;
    .van-tab {
      line-height: 36px;
    }
    .van-tabs__line {
      background-color: #3296fa;
      height: 2px;
    }
  }
  /deep/ .van-tabs__content {
    flex: 1;
    overflow: hidden;
  }
  /deep/ .van-tab__pane {
    height: 100%;
    .scroll-wrapper {
      height: 100%;
      overflow-y: auto;
    }
  }
}
.bar_btn {
  width: 36px;
  height: 35px;
  position: absolute;
  top: 0;
  right: 0;
  &::before {
    content: "";
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 999;
    box-shadow: 0 0 10px #999;
    transform: scale(1, 0.6);
  }
  .van-icon-wap-nav {
    width: 100%;
    height: 100%;
    background: #fff;
    text-align: center;
    line-height: 35px;
    position: relative;
    z-index: 1000;
    &::before {
      font-size: 20px;
    }
  }
}
//编辑频道面板的样式
.van-action-sheet {
  max-height: 100%;
  height: 100%;
  .van-action-sheet__header {
    background: #ed4040;
    color: #fff;
    .van-icon-close {
      color: #fff;
    }
  }
}
</style>
