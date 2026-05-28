// 从配置文件读取API Key（不暴露在代码中）
const config = require('../../utils/config');

Page({
  data: {
    isLoading: true,
    userInput: '',
    chatList: [],
    aiInfo: {
      name: "小美",
      greeting: "哈喔~今天想规划什么样的旅行呢？"
    }
  },

  onLoad() {
    setTimeout(() => {
      this.setData({ isLoading: false });
    }, 2000);
  },

  inputChange(e) {
    this.setData({ userInput: e.detail.value });
  },

  // ===== Markdown → 可读纯文本清洗器 =====
  cleanMarkdown(text) {
    return text
      // 代码块（直接去掉）
      .replace(/```[\s\S]*?```/g, '')
      // 分割线
      .replace(/^---+$/gm, '──────────────')
      // 三级标题
      .replace(/^###\s+(.+)$/gm, '▸ $1')
      // 二级标题
      .replace(/^##\s+(.+)$/gm, '\n📌 $1')
      // 一级标题
      .replace(/^#\s+(.+)$/gm, '\n📌 $1')
      // 无序列表
      .replace(/^[*-]\s+(.+)$/gm, '  ◆ $1')
      // 粗体 → 【】
      .replace(/\*\*(.+?)\*\*/g, '【$1】')
      // 斜体 → 去掉星号
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // 链接 [text](url) → text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // 行内代码 → 去掉反引号
      .replace(/`(.+?)`/g, '$1')
      // 清理多余空行（保留最多1个空行）
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  // ===== 移动端优化：API请求（智能重试+网络适配）=====
  requestAI(input, chatList, retryCount, startTime) {
    retryCount = retryCount || 0;
    startTime = startTime || Date.now();
    const that = this;

    // 移动端适配：30秒足够，太久用户以为卡死
    wx.request({
      url: config.apiUrl,
      method: "POST",
      timeout: 30000,
      header: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + config.apiKey
      },
      data: {
        model: "deepseek-ai/DeepSeek-V4-Pro",
        messages: [
          { 
            role: "system", 
            content: "你是非遗文旅规划师。用纯文本+emoji输出，不使用markdown符号。分点用◆，标题空一行，简短精炼。" 
          },
          { role: "user", content: input }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 500
      },

      success: (res) => {
        console.log("【API返回】耗时:", Date.now() - startTime, "ms");
        let aiReply = "";
        try {
          if (res.statusCode === 200) {
            const raw = res.data?.choices?.[0]?.message?.content ||
                        res.data?.choices?.[0]?.text;
            aiReply = raw ? that.cleanMarkdown(raw) : that.getFallbackReply(input);
          } else if ((res.statusCode === 503 || res.statusCode >= 500) && retryCount < 2) {
            // 服务端冷启动，快速重试
            console.log(`5xx错误，第${retryCount+1}次重试`);
            const delay = retryCount === 0 ? 800 : 1500;
            setTimeout(() => that.requestAI(input, chatList, retryCount+1, startTime), delay);
            return;
          } else {
            aiReply = that.getFallbackReply(input);
          }
        } catch (e) {
          aiReply = that.getFallbackReply(input);
          console.error("解析失败:", e);
        }
        chatList.push({ role: 'ai', content: aiReply });
        that.setData({ chatList });
        wx.hideLoading();
      },

      fail: (err) => {
        console.error("【网络失败】", err.errMsg);
        const elapsed = Date.now() - startTime;
        // 移动端常见：网络切换/超时，前2次快速重试
        if (retryCount < 2 && elapsed < 45000) {
          const delay = retryCount === 0 ? 500 : 1500;
          wx.showToast({ 
            title: `网络波动，自动重试...`, 
            icon: 'none', 
            duration: 1200 
          });
          setTimeout(() => that.requestAI(input, chatList, retryCount+1, startTime), delay);
          return;
        }
        // 最终兜底
        const mockReply = that.getFallbackReply(input);
        chatList.push({ role: 'ai', content: mockReply });
        that.setData({ chatList });
        wx.hideLoading();
        wx.showToast({ title: '已切换离线推荐', icon: 'none' });
      }
    });
  },

  // 智能兜底：根据用户输入返回匹配的非遗推荐
  getFallbackReply(input) {
    const keywords = {
      '北京': '✅ 北京非遗探索\n📍故宫·天坛·南锣鼓巷\n🎨景泰蓝·京绣·兔儿爷\n🏮京剧·抖空竹·鼻烟壶',
      '上海': '✅ 上海非遗之行\n📍豫园·田子坊·石库门\n🎨顾绣·海派剪纸·绒绣\n🏮沪剧·琵琶艺术',
      '苏州': '✅ 苏州非遗雅集\n📍拙政园·平江路·山塘街\n🎨苏绣·缂丝·檀香扇\n🏮昆曲·苏州评弹',
      '杭州': '✅ 杭州非遗寻踪\n📍西湖·河坊街·南宋御街\n🎨龙井茶·丝绸·油纸伞\n🏮越剧·金石篆刻',
      '西安': '✅ 西安非遗之旅\n📍兵马俑·回民街·古城墙\n🎨秦腔·皮影·剪纸\n🏮羊肉泡馍·茯茶',
      '成都': '✅ 成都非遗慢行\n📍宽窄巷子·锦里·文殊院\n🎨蜀绣·川剧·竹编\n🏮盖碗茶·糖画',
      '广州': '✅ 广州非遗漫步\n📍陈家祠·永庆坊·沙面\n🎨粤绣·牙雕·广彩\n🏮粤剧·岭南古琴'
    };
    for (let key in keywords) {
      if (input.includes(key)) return keywords[key];
    }
    const defaults = [
      '✅ 非遗行程规划\n📍苏州｜杭州｜成都\n🎨苏绣·丝绸·蜀绣\n🏮昆曲·越剧·川剧\n🕐建议游玩2-3天',
      '✅ 非遗文化之旅\n📍江南非遗风光带\n🎨缂丝·评弹·龙井\n🏮慢生活·匠人体验',
      '✅ 非遗深度体验\n📍川渝非遗走廊\n🎨蜀绣·竹编·川剧\n🏮变脸·盖碗茶·火锅'
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  },

  sendMsg() {
    const input = this.data.userInput.trim();
    if (!input) return wx.showToast({ title: '请输入需求', icon: 'none' });
  
    const chatList = [...this.data.chatList, { role: 'user', content: input }];
    this.setData({ chatList, userInput: '' });
    wx.showLoading({ title: 'AI生成中...' });

    this.requestAI(input, chatList, 0);
  },

  createNewSession() {
    this.setData({ chatList: [], userInput: '' });
    wx.showToast({ title: '新建会话成功', icon: 'success' });
  }
});