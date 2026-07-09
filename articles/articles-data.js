window.ARTICLE_DATA = [
  {
    "slug": "codex-figma-frontend-workflow",
    "title": "Codex × Figma：UI 设计师的高保真前端落地工作流",
    "category": "AI",
    "date": "公众号文章",
    "readTime": "桐昕设计记录",
    "summary": "最近都在研究codex+figma+gpt的工作流，感觉试了下，感觉效果还是不错的。",
    "sourceUrl": "https://mp.weixin.qq.com/s/R7p0a7YVRgSNNOpNFMZb0Q",
    "sourceLabel": "微信公众号原文",
    "blocks": [
      {
        "type": "paragraph",
        "text": "最近都在研究codex+figma+gpt的工作流，感觉试了下，感觉效果还是不错的，实现了我不会写代码的也能实现我的设计稿，我也来分享一下我的经验。"
      },
      {
        "type": "heading",
        "text": "一、 核心工作流：只要轻松走完这四步"
      },
      {
        "type": "paragraph",
        "text": "将 Figma 接入 Codex 的整体链路其实非常清晰，主要分为以下四步："
      },
      {
        "type": "paragraph",
        "text": "安装与授权：在 Codex 中安装 Figma 插件，并绑定授权你的 Figma 账号。"
      },
      {
        "type": "paragraph",
        "text": "整理与复制：在 Figma 中整理好需要还原的干净页面（拒绝废稿干扰），复制特定的画板（Frame）或页面链接。"
      },
      {
        "type": "paragraph",
        "text": "静态页面生成：把链接粘贴到 Codex，让它读取底层设计数据并快速生成首版静态页面。"
      },
      {
        "type": "paragraph",
        "text": "批注精细化调整：不贪图一次性完美。针对小翻车、小样式间距问题，使用 Codex 的“页面批注功能”圈出来定向改，并逐步补齐动态交互。"
      },
      {
        "type": "heading",
        "text": "二、 基础配置：把 Figma 接进 Codex"
      },
      {
        "type": "paragraph",
        "text": "第一步，我们需要打开 Codex 的插件入口。在 Plugins 市场里搜索 “Figma MCP” 或者 “Figma 插件” 进行安装。"
      },
      {
        "type": "paragraph",
        "text": "安装完成后，系统会提示你进行 Figma 账号授权。这一步绝对不能跳过。有时候授权页面不会在安装完立刻弹出来，而是在你后面第一次让 Codex 读取 Figma 链接时自动触发，按提示登录并允许访问即可。如果遇到 Codex 提示“读不到文件”，90% 都是因为授权没通。"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-01.webp",
        "alt": "Codex Figma workflow image 1"
      },
      {
        "type": "paragraph",
        "text": "因为我已经链接过了，这里给个效果"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-02.webp",
        "alt": "Codex Figma workflow image 2"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-03.webp",
        "alt": "Codex Figma workflow image 3"
      },
      {
        "type": "paragraph",
        "text": "到这里，就已经完成了你的codex与figma的链接，接下来就可以用个你已经完成的设计稿，去到codex已经开发了。"
      },
      {
        "type": "heading",
        "text": "三、 实战演练 1：单画板静态级精准还原"
      },
      {
        "type": "paragraph",
        "text": "如果你只想先尝试还原某一个特定的页面（比如首页、注册页），建议直接复制这个具体 Frame（画板） 的链接，这个链接，如果你是教育版或者是会员的话，可以直接点击开发模式，然后这个链接就有了，以下我用一个网上的源文件进行示范。"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-04.webp",
        "alt": "Codex Figma workflow image 4"
      },
      {
        "type": "paragraph",
        "text": "回到 Codex，我们输入官方标准格式的提示词："
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-05.webp",
        "alt": "Codex Figma workflow image 5"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-06.webp",
        "alt": "Codex Figma workflow image 6"
      },
      {
        "type": "paragraph",
        "text": "可以看出，还原度还是挺高的，就是还是有一些瑕疵，比如图标这些不规则，那么我这边在进行优化一下"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-07.png",
        "alt": "Codex Figma workflow image 7"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-08.webp",
        "alt": "Codex Figma workflow image 8"
      },
      {
        "type": "paragraph",
        "text": "现在就是一些间距问题了，我这边在进行优化下"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-09.webp",
        "alt": "Codex Figma workflow image 9"
      },
      {
        "type": "paragraph",
        "text": "效果都还不错，那么举一反三，我把剩下的两个页面也加进去后，在针对首页进行添加一些滑动效果"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-10.png",
        "alt": "Codex Figma workflow image 10"
      },
      {
        "type": "image",
        "src": "./assets/codex-figma-11.gif",
        "alt": "Codex Figma workflow image 11"
      },
      {
        "type": "paragraph",
        "text": "加了动效后，那么看着其实也还可以，实现的效果还是不错的，能达到设计稿的百分之95了，那么到这里就已经结束了。"
      },
      {
        "type": "heading",
        "text": "⚠️ 经验小提醒："
      },
      {
        "type": "paragraph",
        "text": "目前这套工作流默认出来的底子是网页(H5/Web)的形式。如果你们团队的项目是纯客户端原生开发(原生iOS/Android)，因为底层的工程环境不太一样，记得在提问的时候多给AI补一句硬性要求，比如:\"请使用React Native或者Fluter进行组件重构”，这样出来的小样才最对味!"
      },
      {
        "type": "heading",
        "text": "六、 总结：从“纸面原型”到“触手可及”"
      },
      {
        "type": "paragraph",
        "text": "说实在的，Codex+Figma+GPT的组合，现阶段确实没法让你闭着眼睛、一键百分之百直接完美交付给生产环境。中间偶尔缺个小图标、样式微调两下在所难免。但它真正恐怖的地方在于--颠覆了研发和原型的效率!"
      },
      {
        "type": "paragraph",
        "text": "以前要找开发写一两天的复杂交互、高保真动态原型，现在你只要花上一个多小时，就能从Figma里的一堆死图，变成一个真真切切能点击、有过渡动效、能直接拿去跟老板或者客户做靠谱汇报的交互级高保真原型!"
      }
    ]
  },
  {
    "slug": "saas-information-hierarchy",
    "title": "B 端 SaaS 信息层级如何降低决策成本",
    "category": "设计分享",
    "date": "2026",
    "readTime": "8 min read",
    "summary": "从复杂表格、状态反馈、任务流转和权限角色切入，梳理高频业务界面里更清晰的信息组织方法。"
  },
  {
    "slug": "ai-visual-direction-prep",
    "title": "用 AI 快速生成视觉方向前的准备工作",
    "category": "AI",
    "date": "2026",
    "readTime": "5 min read",
    "summary": "把需求、风格、限制条件和输出标准提前整理清楚，可以显著减少无效试错，让 AI 更像一个稳定的设计协作者。"
  },
  {
    "slug": "mobile-micro-interactions",
    "title": "移动端产品里被忽略的微交互细节",
    "category": "设计分享",
    "date": "2026",
    "readTime": "7 min read",
    "summary": "围绕触达、加载、状态切换和错误恢复，拆解那些不会喧宾夺主、却能让体验更顺手的小型交互设计。"
  }
];
