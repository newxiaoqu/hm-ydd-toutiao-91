<template>
<!-- 评论列表组件 -->
  <div class="comment">
      <!-- 列表  上拉加载功能  Loading 是否开启加载状态 -->
    <van-list v-model="loading" :finished="finished" @load="onLoad" finished-text="没有更多了">
      <div class="item van-hairline--bottom van-hairline--top" v-for="comment in comments" :key="comment.com_id.toString()">
        <van-image
          round
          width="1rem"
          height="1rem"
          fit="fill"
          :src="comment.aut_photo"
        />
        <div class="info">
          <p>
            <span class="name">{{ comment.aut_name }}</span>
            <span style="float:right">
              <span class="van-icon van-icon-good-job-o zan"></span>
              <span class="count">{{ comment.like_count }}</span>
            </span>
          </p>
          <p>{{ comment.content }}</p>
          <p>
            <span class="time">{{ comment.pubdate | relTime }}</span>&nbsp;
            <van-tag plain @click="openReply(comment.com_id)">{{ comment.reply_count }} 回复</van-tag>
          </p>
        </div>
      </div>
    </van-list>
    <div class="reply-container van-hairline--top">
      <van-field v-model="value" placeholder="写评论...">
        <van-loading v-if="submiting" slot="button" type="spinner" size="16px"></van-loading>
        <span class="submit" @click="submit()" v-else slot="button">提交</span>
      </van-field>
    </div>
       <!-- 回复列表组件 -->
    <van-action-sheet @closed="reply.commentId=null" v-model="showReply" :round="false" class="reply_dailog" title="回复评论">
      <van-list @load="getReply" :immediate-check="false" v-model="reply.loading" :finished="reply.finished" finished-text="没有更多了">
        <div class="item van-hairline--bottom van-hairline--top" v-for="reply in reply.list" :key="reply.com_id.toString()">
          <van-image round width="1rem" height="1rem" fit="fill" src="reply.aut_photo" />
          <div class="info">
            <p><span class="name">{{ reply.aut_name }}</span></p>
            <p>{{ reply.content }}</p>
            <p><span class="time">{{ reply.pubdate|relTime }}</span></p>
          </div>
        </div>
      </van-list>
    </van-action-sheet>
  </div>

  <!-- 都不输入框 -->
</template>

<script>
import { getComments, commentOrReply } from '@/api/article'
export default {
  name: 'comment',
  data () {
    return {
      // 上拉加载中
      loading: false,
      // 全部加载完毕
      finished: false,
      // 输入的内容
      value: '',
      // 控制提交中状态数据
      submiting: false,
      // 评论列表数据
      comments: [],
      // 表示分页依据  如果为空，表示从第一页开始
      offset: null,
      // ------------回复相关数据-----------------
      // 控制回复弹窗显示隐藏
      showReply: false, // 控制回复列表组件的显示和隐藏
      reply: {
        // 专门用reply这个对象存放回复相关的数据
        loading: false, // 是回复列表组件的状态
        finished: false, // 是恢复列表组件的结束状态
        offset: null, // 偏移量  获取评论的评论的分页依据 c
        list: [], // 用于存放当前弹出的关于某个评论的回复列表的数据
        commentId: null // 用来存放当前点击的评论Id
      }
    }
  },
  methods: {
    // 加载一级评论
    async onLoad () {
      let data = await getComments({
        type: 'a', // 获取的类型
        offset: this.offset, // 偏移量
        source: this.$route.query.articleId // 获取文章id
      })
      this.comments.push(...data.results) // 添加数据到评论列表的尾部
      this.loading = false // 关闭下拉加载状态
      this.finished = data.last_id === data.end_id // 是否已经请求到最后一页
      if (!this.finished) {
        // 如果没结束
        this.offset = data.last_id // 将last_id设置成偏移量  给下次请求使用
      }
    },
    // 打开回复列表面板
    openReply (commentId) {
      this.showReply = true // 弹出面板
      // 进行若干操作
      this.reply.commentId = commentId // 存储当前点击的commentId
      this.reply.list = [] // 清空原有数据
      this.reply.offset = null // 重置回复的偏移量 因为每个评论的评论都是从第一页开始的
      this.reply.finished = false // 设置成原始状态
      this.reply.loading = true // 主动打开加载状态  因为这个时候没有了自动检查
      // 开始加载第一页的数据了
      this.getReply() // 开始调用第一页的数据
    },
    // 获取回复数据
    async getReply () {
      let data = await getComments({
        type: 'c',
        offset: this.reply.offset, // 偏移量
        source: this.reply.commentId.toString() // 获取文章的id
      })
      this.reply.list.push(...data.results) // 添加数据到评论的尾部
      this.reply.loading = false // 关闭加载状态
      this.reply.finished = data.end_id === data.last_id // 加载状态
      if (!this.reply.finished) {
        // 如果没结束
        this.reply.offset = data.last_id // 将last_id设置成偏移量 给下次请求使用
      }
    },
    // 提交评论的方法
    async submit () {
      if (!this.value) return false // 表示如果当前评论内容为空就立刻返回
      this.submiting = true // 将提交状态设置成true控制用户单位时间内评论的数据次数
      await this.$sleep() // 强制等待500毫秒
      try {
        // 评论
        // 一种是对文章进行评论
        // 一种是对评论进行评论
        // 如果不为空 继续
        // 怎么样区分当前是对文章进行评论  还是对评论进行评论
        // 两种方式  一种方式通过showReply是true还是false
        // 另外一种是通过reply.commentId是存在还是不存在
        const data = await commentOrReply({
          // this.reply.commentId存在 就要对评论进行评论  否则传文章Id
          target: this.reply.commentId ? this.reply.commentId.toString() : this.$route.query.articleId, // 要么是文章id，要么是评论id
          content: this.value, // 评论的内容
          art_id: this.reply.commentId ? this.$route.query.articleId : null // 如果此时对文章进行评论art_id不能传 如果是对评论进行评论  文章ID必须传
        })
        // 评论成功怎么处理  刷新页面 => 将评论的数据呈现到视图上
        // 需要知道加那个数组的最前面
        if (this.reply.commentId) {
          // 对评论进行评论
          this.reply.list.unshift(data.new_obj) // 将数据加到队首 评论的评论
          // 如果对评论的进行评论之后，应该找到该评论 并将 该评论的回复次数 +1
          // 怎么找到对应的评论
          // 如果找到了comment 就是找到的对象  如果找不到comment就是一个undefined
          const comment = this.comments.find(item => item.com_id.toString())
          comment && comment.reply_count++ // 如果找到了  就对回复加1
        } else {
          // 对文章进行评论
          this.comments.unshift(data.new_obj) // 文章评论
        }
        this.value = '' // 清空输入框
      } catch (error) {
        this.$gnotify({ type: 'danger', message: '评论失败' })
      }
      // 最后去关闭状态
      this.submiting = false // 关闭进度条
    }
  }
}
</script>

<style lang='less' scoped>
.comment {
  margin-top: 10px;
  /deep/ .item {
    display: flex;
    padding: 10px 0;
    .info {
      flex: 1;
      padding-left: 10px;
      .name{
        color:#069;
      }
      .zan{
        vertical-align:middle;
        padding-right:2px;
      }
      .count{
        vertical-align:middle;
        font-size:10px;
        color: #666;
      }
      .time{
        color: #666;
      }
      p {
        padding: 5px 0;
        margin: 0;
      }
    }
  }
  /deep/ .van-button:active::before {
    background: transparent;
  }
}
.reply-container {
  position: fixed;
  left: 0;
  bottom: 0;
  height: 44px;
  width: 100%;
  background: #f5f5f5;
  z-index: 9999;
  .submit {
    font-size: 12px;
    color: #3296fa;
  }
}
.reply_dailog {
  height: 100%;
  max-height: 100%;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  .van-action-sheet__header {
    background: #3296fa;
    color: #fff;
    .van-icon-close {
      color: #fff;
    }
  }
  .van-action-sheet__content{
    flex: 1;
    overflow-y: auto;
    padding: 0 10px 44px;
  }
}
</style>
