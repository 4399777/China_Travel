// pages/3d_model/3d_model.js - 匠影工坊：非遗3D模型展示
Page({
  data: {
    // 触控旋转参数
    rotateY: 0,        // Y轴旋转角度（左右）
    rotateX: 0,        // X轴旋转角度（上下）
    scale: 1,          // 缩放比例
    isDragging: false, // 是否正在拖拽

    // 当前选中的模型
    currentModel: null,

    // 模型列表（★ 替换为你的3D模型实际图片 ★）
    models: [
      {
        id: 1,
        name: '景德镇陶瓷',
        subtitle: 'Jingdezhen Ceramics',
        category: '传统技艺',
        level: '国家级非遗',
        dynasty: '宋代 · 传承千年',
        color: '#E8734A',
        description: '景德镇手工制瓷技艺，始于汉代，兴于宋代。\"白如玉、明如镜、薄如纸、声如磬\"，是中国陶瓷文化的巅峰代表，被誉为\"瓷都\"。',
        image: '/static/images/fei.jpg',
        thumbnail: '/static/images/fei.jpg',
        detailUrl: ''
      },
      {
        id: 2,
        name: '苏绣',
        subtitle: 'Suzhou Embroidery',
        category: '传统美术',
        level: '国家级非遗',
        dynasty: '春秋 · 两千余年',
        color: '#E84A5F',
        description: '苏绣是中国四大名绣之首，起源于春秋时期。\"平、齐、细、密、匀、顺、和、光\"八字诀，一针一线绣出江南水乡的温婉灵动。',
        image: '/static/images/fei.jpg',
        thumbnail: '/static/images/fei.jpg',
        detailUrl: ''
      },
      {
        id: 3,
        name: '东阳木雕',
        subtitle: 'Dongyang Wood Carving',
        category: '传统美术',
        level: '国家级非遗',
        dynasty: '唐代 · 千年绝技',
        color: '#C49B4A',
        description: '东阳木雕始于唐代，以浮雕、镂空雕技艺闻名。刀法细腻，层次丰富，\"鬼斧神工\"般的雕刻技艺让朽木焕发新生。',
        image: '/static/images/fei.jpg',
        thumbnail: '/static/images/fei.jpg',
        detailUrl: ''
      },
      {
        id: 4,
        name: '皮影戏',
        subtitle: 'Shadow Puppetry',
        category: '传统戏剧',
        level: '人类非遗代表作',
        dynasty: '西汉 · 千年光影',
        color: '#D4AF37',
        description: '皮影戏是\"电影的鼻祖\"，始于西汉。牛皮雕刻、灯光投影，\"一口叙说千古事，双手对舞百万兵\"，演绎中华千年传奇。',
        image: '/static/images/fei.jpg',
        thumbnail: '/static/images/fei.jpg',
        detailUrl: ''
      },
      {
        id: 5,
        name: '中国剪纸',
        subtitle: 'Paper Cutting Art',
        category: '传统美术',
        level: '人类非遗代表作',
        dynasty: '北朝 · 千载传承',
        color: '#E8302A',
        description: '中国剪纸源于北朝，\"一剪之巧夺天工\"。红纸翻转间，花鸟鱼虫跃然纸上，承载着中国人对美好生活的千年祈愿。',
        image: '/static/images/fei.jpg',
        thumbnail: '/static/images/fei.jpg',
        detailUrl: ''
      }
    ],

    // 光环动画
    ringAni: null
  },

  // ========== 生命周期 ==========
  onLoad(options) {
    // 默认选中第一个模型
    const firstModel = this.data.models[0];
    this.setData({
      currentModel: firstModel
    });
  },

  onReady() {
    // 光环呼吸动画
    this.startRingAnimation();
  },

  // 光环呼吸动画
  startRingAnimation() {
    const animation = wx.createAnimation({
      duration: 2000,
      timingFunction: 'ease-in-out',
    });

    const breathe = () => {
      animation.scale(1.08).opacity(0.4).step();
      this.setData({ ringAni: animation.export() });
      
      setTimeout(() => {
        animation.scale(1).opacity(1).step();
        this.setData({ ringAni: animation.export() });
      }, 2000);
    };

    breathe();
    this.ringTimer = setInterval(breathe, 4000);
  },

  // ========== 触控事件：3D旋转 ==========
  onTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.startRotateY = this.data.rotateY;
    this.startRotateX = this.data.rotateX;
    this.setData({ isDragging: true });
  },

  onTouchMove(e) {
    if (!this.touchStartX) return;
    const touch = e.touches[0];
    
    // 计算手指滑动距离
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // 换算为旋转角度（灵敏度可调）
    const sensitivity = 0.3;
    const rotateY = this.startRotateY + deltaX * sensitivity;
    const rotateX = this.startRotateX - deltaY * sensitivity; // Y轴反转

    // 限制旋转范围（避免过度旋转）
    const clampedY = Math.max(-45, Math.min(45, rotateY));
    const clampedX = Math.max(-30, Math.min(30, rotateX));

    this.setData({
      rotateY: clampedY,
      rotateX: clampedX,
      scale: 1.05
    });
  },

  onTouchEnd() {
    this.touchStartX = null;
    this.touchStartY = null;
    this.setData({ 
      isDragging: false,
      scale: 1.0
    });
    
    // 松手后平滑回弹到0
    setTimeout(() => {
      this.setData({
        rotateY: 0,
        rotateX: 0
      });
    }, 300);
  },

  // ========== 选择模型 ==========
  selectModel(e) {
    const index = e.currentTarget.dataset.index;
    const model = this.data.models[index];
    
    // 切换模型时重置视角
    this.setData({
      currentModel: model,
      rotateY: 0,
      rotateX: 0,
      scale: 1
    });
    
    // 震动反馈
    wx.vibrateShort({ type: 'light' });
  },

  // ========== 重置视角 ==========
  resetView() {
    const animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease-out',
    });
    
    this.setData({
      rotateY: 0,
      rotateX: 0,
      scale: 1
    });
    
    wx.vibrateShort({ type: 'medium' });
  },

  // ========== 查看详情 ==========
  gotoDetail() {
    const model = this.data.currentModel;
    if (model.detailUrl) {
      wx.navigateTo({ url: model.detailUrl });
    } else {
      wx.showToast({
        title: model.name + '详情页开发中',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // ========== 生命周期：清理定时器 ==========
  onUnload() {
    if (this.ringTimer) clearInterval(this.ringTimer);
  },

  // ========== 分享 ==========
  onShareAppMessage() {
    return {
      title: '非遗·新生 - 3D数字模型展示',
      path: '/pages/3d_model/3d_model',
      imageUrl: '/static/images/fei.jpg'
    };
  }
});
