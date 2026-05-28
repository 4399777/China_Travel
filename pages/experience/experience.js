Page({
  // 页面初始数据
  data: {
    isLoading: true,  // 加载状态：控制传统纹样旋转动画显示/隐藏
    carouselAni: null // 文字轮播动画实例
  },

  // 页面加载时执行
  onLoad(options) {
    // 模拟2秒加载（可替换为真实接口请求，无需修改）
    setTimeout(() => {
      this.setData({ isLoading: false }); // 隐藏加载层
      this.startCarousel(); // 启动底部非遗文字无缝轮播
    }, 2000);
  },

  // 核心功能：底部非遗文字无缝轮播（代码无修改，保留原有效果）
  startCarousel() {
    const animation = wx.createAnimation({
      duration: 20000, // 轮播速度：数值越大越慢，可自定义
      timingFunction: 'linear', // 匀速滚动，不卡顿
      delay: 0
    });
    // 轮播循环逻辑
    const carouselLoop = () => {
      animation.translateX(0).step();
      this.setData({ carouselAni: animation.export() });
      setTimeout(() => {
        animation.translateX('-100%').step();
        this.setData({ carouselAni: animation.export() });
      }, 100);
    };
    carouselLoop();
    // 定时器重复执行，实现无限轮播
    this.carouselTimer = setInterval(carouselLoop, 20000);
  },

  // 匠影工坊透明按钮 - 页面跳转（★ 替换为你的实际页面路径 ★）
  goto3DPage() {
    wx.navigateTo({
      url: '/pages/3d_model/3d_model' 
    });
  },

  // 面谱绘心透明按钮 - 页面跳转（★ 替换为你的实际页面路径 ★）
  gotoARPage() {
    wx.navigateTo({
      url: '/pages/ar_face/ar_face' // 示例路径，改成你自己的AR页面路径
    });
  },

  // 底部印章图片分享按钮 - 点击事件（仅开启分享权限，符合小程序API规则）
  onShareTap() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'] // 开启「好友+朋友圈」分享
    });
    // 提示用户点击右上角分享（可选，可删除）
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none',
      duration: 1500
    });
  },

  // 生命周期函数：分享给微信好友（自定义分享内容，必须直接写在Page内）
  onShareAppMessage() {
    return {
      title: '非遗·新生 - 数字技术传承传统技艺', // 分享标题，可自定义
      path: '/pages/experience/experience',       // 分享的页面路径，保持不变
      imageUrl: '/static/images/feiyi.jpg'        // 分享封面图，用你的背景图
    };
  },

  // 生命周期函数：分享到微信朋友圈（自定义分享内容，无多余分号修复）
  onShareTimeline() {
    return {
      title: '非遗·新生 - 指尖传承千年匠艺，数字赋能非遗未来', // 朋友圈文案，可自定义
      imageUrl: '/static/images/feiyi.jpg'                      // 朋友圈封面图，和好友分享一致
    };
  },

  // 页面卸载时执行：清除轮播定时器，防止内存泄漏（保留原有逻辑）
  onUnload() {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
  }
});