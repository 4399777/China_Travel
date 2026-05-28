import streamlit as st
import os
import json
import time
from datetime import datetime
from openai import OpenAI

# 设置页面配置
st.set_page_config(
    page_title="AI智能伴侣 - 非遗主题旅游助手",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded"
)


# 应用CSS样式
def apply_custom_css():
    st.markdown("""
    <style>
    /* 主容器样式 */
    .main-container {
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 10px;
    }

    /* 侧边栏样式 */
    .sidebar .sidebar-content {
        background-color: #f0f2f6;
    }

    /* 会话历史样式 */
    .chat-history-item {
        padding: 10px;
        margin: 5px 0;
        background-color: #ffffff;
        border-radius: 8px;
        border-left: 4px solid #4CAF50;
        cursor: pointer;
        transition: all 0.2s;
    }

    .chat-history-item:hover {
        background-color: #e8f5e9;
        transform: translateX(5px);
    }

    /* 消息气泡样式 */
    .user-message {
        background-color: #e3f2fd;
        padding: 12px 16px;
        border-radius: 18px 18px 4px 18px;
        margin: 8px 0;
        max-width: 80%;
        margin-left: auto;
    }

    .ai-message {
        background-color: #f1f8e9;
        padding: 12px 16px;
        border-radius: 18px 18px 18px 4px;
        margin: 8px 0;
        max-width: 80%;
        margin-right: auto;
    }

    /* 按钮样式 */
    .stButton > button {
        background-color: #4CAF50;
        color: white;
        border-radius: 20px;
        border: none;
        padding: 10px 24px;
        font-weight: 600;
    }

    .stButton > button:hover {
        background-color: #45a049;
    }

    /* 标题样式 */
    .main-title {
        color: #2E7D32;
        font-size: 2.2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #C8E6C9;
    }

    /* 输入框样式 */
    .stTextInput > div > div > input {
        border-radius: 20px;
        border: 1px solid #C8E6C9;
    }

    /* 选择框样式 */
    .stSelectbox > div > div > div {
        border-radius: 10px;
        border: 1px solid #C8E6C9;
    }

    /* 多选样式 */
    .stMultiSelect > div > div > div {
        border-radius: 10px;
        border: 1px solid #C8E6C9;
    }

    /* 滑动条样式 */
    .stSlider > div > div {
        border-radius: 10px;
    }

    /* 会话标题 */
    .session-title {
        font-size: 1.1rem;
        font-weight: bold;
        color: #2E7D32;
        margin-bottom: 0.5rem;
    }
    </style>
    """, unsafe_allow_html=True)


apply_custom_css()


# 初始化OpenAI客户端
@st.cache_resource
def init_openai_client():
    api_key = os.environ.get("DeepSeek_API_KEY")
    if not api_key:
        # 如果环境变量中没有，尝试从secrets中获取
        try:
            api_key = st.secrets["DeepSeek_API_KEY"]
        except:
            api_key = None

    if api_key:
        try:
            client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
            return client, True
        except Exception as e:
            st.error(f"初始化API客户端失败: {e}")
            return None, False
    else:
        return None, False


# 初始化会话状态
def init_session_state():
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []

    if 'current_session_id' not in st.session_state:
        st.session_state.current_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    if 'sessions' not in st.session_state:
        st.session_state.sessions = {
            st.session_state.current_session_id: {
                "id": st.session_state.current_session_id,
                "title": "新建会话",
                "history": []
            }
        }

    if 'user_preferences' not in st.session_state:
        st.session_state.user_preferences = {
            "destination": "",
            "travel_duration": 3,
            "travel_style": ["文化探索", "美食体验", "自然风光"],
            "budget_level": "中等",
            "interests": ["传统手工艺", "民俗表演", "地方戏曲", "传统节日"],
            "special_requirements": ""
        }

    if 'ai_persona' not in st.session_state:
        st.session_state.ai_persona = {
            "name": "小美",
            "personality": "温柔可爱一口台湾腔的台湾妹子",
            "greeting": "哈喔~今天想規劃什麼樣的旅行呢？"
        }


# 生成AI回复
def generate_ai_response(client, user_input, context):
    try:
        # 构建系统提示词
        system_prompt = f"""你是一位专业的非遗主题旅行规划师，名字是{st.session_state.ai_persona["name"]}，性格是{st.session_state.ai_persona["personality"]}。

        用户信息：
        - 目的地偏好：{st.session_state.user_preferences["destination"] if st.session_state.user_preferences["destination"] else "未指定"}
        - 旅行时长：{st.session_state.user_preferences["travel_duration"]}天
        - 旅行风格：{", ".join(st.session_state.user_preferences["travel_style"])}
        - 预算水平：{st.session_state.user_preferences["budget_level"]}
        - 兴趣偏好：{", ".join(st.session_state.user_preferences["interests"])}
        - 特殊要求：{st.session_state.user_preferences["special_requirements"] if st.session_state.user_preferences["special_requirements"] else "无"}

        请根据用户的偏好信息，提供个性化的非遗主题旅游方案建议。回答时请保持你的人物设定性格。
        """

        # 构建消息历史
        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # 添加上下文消息
        for msg in context[-6:]:  # 只保留最近6条消息作为上下文
            if msg["role"] == "user":
                messages.append({"role": "user", "content": msg["content"]})
            elif msg["role"] == "assistant":
                messages.append({"role": "assistant", "content": msg["content"]})

        # 添加当前用户输入
        messages.append({"role": "user", "content": user_input})

        # 调用DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content
    except Exception as e:
        return f"抱歉，生成回复时出现错误：{str(e)}。请检查您的API密钥或网络连接。"


# 创建新的会话
def create_new_session():
    new_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    st.session_state.current_session_id = new_session_id
    st.session_state.sessions[new_session_id] = {
        "id": new_session_id,
        "title": "新建会话",
        "history": []
    }
    st.session_state.chat_history = []
    st.rerun()


# 加载历史会话
def load_session(session_id):
    st.session_state.current_session_id = session_id
    if session_id in st.session_state.sessions:
        st.session_state.chat_history = st.session_state.sessions[session_id]["history"]
    st.rerun()


# 保存当前会话
def save_current_session():
    session_id = st.session_state.current_session_id
    if session_id in st.session_state.sessions:
        st.session_state.sessions[session_id]["history"] = st.session_state.chat_history

        # 如果会话还没有标题，根据第一条消息生成标题
        if st.session_state.sessions[session_id]["title"] == "新建会话" and len(st.session_state.chat_history) > 0:
            first_message = st.session_state.chat_history[0]["content"][:30] + "..." if len(
                st.session_state.chat_history[0]["content"]) > 30 else st.session_state.chat_history[0]["content"]
            st.session_state.sessions[session_id]["title"] = first_message


# 主应用函数
def main():
    # 初始化
    init_session_state()
    client, api_available = init_openai_client()

    # 侧边栏
    with st.sidebar:
        st.markdown("## ✨ AI控制面板")

        # 新建会话按钮
        if st.button("📝 新建会话", use_container_width=True):
            create_new_session()

        st.divider()

        # 当前会话显示
        st.markdown(f"### 当前会话")
        current_session = st.session_state.sessions[st.session_state.current_session_id]
        st.markdown(f"**{current_session['title']}**")
        st.caption(f"ID: {current_session['id']}")

        st.divider()

        # 历史会话
        st.markdown("### 📜 历史会话")

        # 按时间倒序排列会话
        sorted_sessions = sorted(
            st.session_state.sessions.items(),
            key=lambda x: x[0],
            reverse=True
        )

        for session_id, session in sorted_sessions:
            if session_id == st.session_state.current_session_id:
                continue

            session_title = session["title"]
            session_date = session_id[:8]
            session_time = f"{session_id[9:11]}:{session_id[11:13]}"

            col1, col2 = st.columns([3, 1])
            with col1:
                if st.button(f"{session_title}", key=f"session_{session_id}"):
                    load_session(session_id)
            with col2:
                st.caption(f"{session_time}")

        st.divider()

        # API状态
        st.markdown("### 🔌 API状态")
        if api_available:
            st.success("DeepSeek API 已连接")
        else:
            st.error("DeepSeek API 未连接")
            st.info("请设置DeepSeek_API_KEY环境变量")

        # 部署信息
        st.divider()
        st.markdown("### 🚀 Deploy")
        st.caption("AI智能伴侣 v1.0")
        st.caption("非遗主题旅游助手")

    # 主界面
    st.markdown('<h1 class="main-title">🧳 AI智能伴侣 - 非遗主题旅游助手</h1>', unsafe_allow_html=True)

    # 创建两列布局
    col1, col2 = st.columns([2, 1])

    with col1:
        # 聊天历史显示区域
        st.markdown("### 💬 对话历史")

        chat_container = st.container(height=500, border=True)

        with chat_container:
            if len(st.session_state.chat_history) == 0:
                # 显示初始问候
                st.markdown(f'<div class="ai-message">{st.session_state.ai_persona["greeting"]}</div>',
                            unsafe_allow_html=True)

            for message in st.session_state.chat_history:
                if message["role"] == "user":
                    st.markdown(f'<div class="user-message">👤 {message["content"]}</div>', unsafe_allow_html=True)
                elif message["role"] == "assistant":
                    st.markdown(f'<div class="ai-message">🤖 {message["content"]}</div>', unsafe_allow_html=True)

        # 用户输入区域
        st.markdown("### 💭 请输入您的旅行诉求")
        user_input = st.text_input(
            "请输入您的问题..",
            key="user_input",
            label_visibility="collapsed",
            placeholder="例如：我想去云南体验非遗文化，有什么推荐吗？"
        )

        col_btn1, col_btn2, col_btn3 = st.columns(3)
        with col_btn1:
            send_button = st.button("🚀 发送", use_container_width=True)
        with col_btn2:
            clear_button = st.button("🗑️ 清除对话", use_container_width=True)
        with col_btn3:
            example_button = st.button("💡 示例问题", use_container_width=True)

        # 示例问题
        if example_button:
            example_questions = [
                "我想去福建体验土楼文化，有什么推荐路线吗？",
                "帮我规划一个3天的苏州非遗之旅",
                "推荐一些适合体验传统手工艺的旅行地",
                "如何将非遗体验融入家庭旅行？",
                "西安有哪些值得体验的非遗项目？"
            ]

            # 随机选择一个示例问题
            import random
            example = random.choice(example_questions)
            st.session_state.user_input = example

    with col2:
        # 用户偏好设置
        st.markdown("### ⚙️ 旅行偏好设置")

        with st.form("preferences_form"):
            st.session_state.user_preferences["destination"] = st.text_input(
                "目的地",
                value=st.session_state.user_preferences["destination"],
                placeholder="例如：云南、福建、北京..."
            )

            st.session_state.user_preferences["travel_duration"] = st.slider(
                "旅行天数",
                min_value=1,
                max_value=14,
                value=st.session_state.user_preferences["travel_duration"]
            )

            travel_styles = ["文化探索", "美食体验", "自然风光", "历史遗迹", "休闲度假", "冒险探索"]
            st.session_state.user_preferences["travel_style"] = st.multiselect(
                "旅行风格",
                options=travel_styles,
                default=st.session_state.user_preferences["travel_style"]
            )

            budget_options = ["经济型", "中等", "豪华"]
            st.session_state.user_preferences["budget_level"] = st.selectbox(
                "预算水平",
                options=budget_options,
                index=budget_options.index(st.session_state.user_preferences["budget_level"])
            )

            interest_options = ["传统手工艺", "民俗表演", "地方戏曲", "传统节日", "古建筑", "传统美食", "民间艺术",
                                "传统医药"]
            st.session_state.user_preferences["interests"] = st.multiselect(
                "兴趣偏好",
                options=interest_options,
                default=st.session_state.user_preferences["interests"]
            )

            st.session_state.user_preferences["special_requirements"] = st.text_area(
                "特殊要求",
                value=st.session_state.user_preferences["special_requirements"],
                placeholder="例如：带老人出行、需要无障碍设施、素食要求等..."
            )

            # AI角色设置
            st.divider()
            st.markdown("### 🤖 AI角色设置")
            st.session_state.ai_persona["name"] = st.text_input(
                "名字",
                value=st.session_state.ai_persona["name"]
            )

            st.session_state.ai_persona["personality"] = st.text_input(
                "性格",
                value=st.session_state.ai_persona["personality"]
            )

            submit_preferences = st.form_submit_button("💾 保存偏好设置")
            if submit_preferences:
                st.success("偏好设置已保存！")

    # 处理发送消息
    if send_button and user_input:
        if not api_available:
            st.error("无法发送消息：API未连接。请检查您的API密钥设置。")
        else:
            # 添加用户消息到历史
            st.session_state.chat_history.append({"role": "user", "content": user_input})

            # 显示用户消息
            with chat_container:
                st.markdown(f'<div class="user-message">👤 {user_input}</div>', unsafe_allow_html=True)

            # 生成AI回复
            with st.spinner(f'{st.session_state.ai_persona["name"]}正在思考...'):
                ai_response = generate_ai_response(client, user_input, st.session_state.chat_history)

                # 添加AI回复到历史
                st.session_state.chat_history.append({"role": "assistant", "content": ai_response})

                # 显示AI回复
                with chat_container:
                    st.markdown(f'<div class="ai-message">🤖 {ai_response}</div>', unsafe_allow_html=True)

            # 保存会话
            save_current_session()

            # 清空输入框
            st.session_state.user_input = ""
            st.rerun()

    # 处理清除对话
    if clear_button:
        st.session_state.chat_history = []
        st.rerun()


if __name__ == "__main__":
    main()