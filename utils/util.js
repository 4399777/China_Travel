// 获取全局APP实例
const app = getApp();
const baseApi = app.globalData.baseApi;

// 封装微信请求（Promise化，方便异步调用）
const request = (url, method = "POST", data = {}) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...', mask: true });
    wx.request({
      url: baseApi + url,
      method,
      data,
      header: {
        "Content-Type": "application/json"
      },
      success: res => {
        wx.hideLoading();
        if (res.data.code === 200) {
          resolve(res.data.data);
        } else {
          wx.showToast({ title: res.data.msg || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      }
    })
  })
}

// 1. 定制化文旅规划 - 调用大模型API
export const getTravelPlan = (data) => {
  return request("/api/ai/travelPlan", "POST", data);
  // 替换为你的非遗微调大模型API地址：如https://xxx.com/api/非遗文旅规划
};

// 2. 沉浸式非遗交互 - AR/VR手势识别API（接收录制的视频，返回识别结果）
export const recognizeFeiYi = (data) => {
  return request("/api/ar/recognize", "POST", data);
  // 替换为你的AR/VR识别API地址：如https://xxx.com/api/非遗手势识别
};

// 3. 个人中心 - 获取用户历史记录（可选，答辩可做假数据）
export const getUserHistory = (userId) => {
  return request("/api/user/history", "POST", { userId });
};