const app = getApp();
Page({
  data: {
    userInfo: app.globalData.userInfo || {} // 全局用户信息
  },

  onShow() {
    // 页面显示时更新用户信息
    this.setData({ userInfo: app.globalData.userInfo || {} });
  },

  // 跳转到历史记录
  toHistory() {
    wx.showToast({ title: '历史记录页面待开发', icon: 'none' });
  },

  // 关于我们
  toAbout() {
    wx.showModal({
      title: '关于我们',
      content: '非遗文旅AI助手是基于非遗专属数据微调大模型+AR/VR技术的轻量化小程序，为外籍用户打造定制化、沉浸式的非遗文旅体验，助力非遗文化国际传播。',
      showCancel: false
    });
  }
})