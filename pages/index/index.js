Page({
  // 跳转至文旅规划页
  goToPlan() {
    wx.switchTab({
      url: '/pages/plan/plan'
    })
  },

  // 跳转至非遗体验页
  goToExperience() {
    wx.switchTab({
      url: '/pages/experience/experience'
    })
  }
})