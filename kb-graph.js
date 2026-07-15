/* =========================================================
   Knowledge Graph — force-directed network of the personal
   knowledge base. Vanilla JS + canvas, no dependencies.
   Inspired by 马兆远《世界的逻辑》: 知识的累积靠逻辑，
   连接到临界点便形成网络，引发"知识大爆炸"。
   ========================================================= */
(function () {
  "use strict";

  var WIKI = "https://cv4otn5bwh0.feishu.cn/wiki/";

  /* ---- categories (fixed slot order = fixed hue order) ---- */
  var CATS = [
    { key: "ai",      name: "AI · LLM · Agent",   tag: "AI / LLM / AGENT" },
    { key: "tool",    name: "飞书生态 · 工具",     tag: "FEISHU / TOOLING" },
    { key: "venture", name: "创业 · 商业 · 获客",  tag: "VENTURE / GROWTH" },
    { key: "self",    name: "个人成长 · 自我管理", tag: "SELF / GROWTH" },
    { key: "track",   name: "行业研究 · 赛道分析", tag: "INDUSTRY / TRACK" },
    { key: "read",    name: "读书 · 课程笔记",     tag: "READING / NOTES" }
  ];

  /* ---- documents: id, title, cat (+cat2 交叉收录), wiki token, summary, tags ---- */
  var DOCS = [
    { id: "ai-learn", t: "AI 学习", c: 0, k: "FoS0w1lUOicD7DkGMLCc2X2Sng7",
      s: "以第一性原理为指导的个人 AI 学习路线：9 个月 Python 入门 → 李沐《动手学深度学习》五步循环 → 论文精读，终极目标是 AI for 科研。",
      g: ["AI学习路径", "深度学习", "李沐", "第一性原理"] },
    { id: "ai-manual", t: "AI 说明书", c: 0, k: "X8MgwjRnFipTQok99GqcdXS7nXg",
      s: "AI 工具能力边界与使用策略备忘：核心是「分而治之」，让不同 AI 工具并行处理不同类型任务以提升整体效率。",
      g: ["AI工具", "使用策略", "分而治之"] },
    { id: "prompt", t: "Prompt Engineering", c: 0, c2: 1, k: "VDpZwji5uiuxPhkHZnzctNmwnSh",
      s: "10 个降低 Claude Token 消耗的使用习惯：编辑提示词而非新开对话、定期总结开新窗口、Project 缓存文件等，本质是运用长短期记忆机制。",
      g: ["Prompt", "Claude", "上下文管理"] },
    { id: "agent-coop", t: "Agent 合作", c: 0, k: "QiAAwL9aDiBEcskRxflcferunKg",
      s: "大模型 Agent 训练营的合作运营规划：整合课程资源与定价，用企业人格化、讲故事方式构建「知名度-美誉度-忠诚度」三度体系。",
      g: ["Agent训练营", "品牌定位", "三度体系"] },
    { id: "inflection", t: "《拐点》", c: 0, k: "SRP6w2QPviufWZkHBG0cFhpMn0e",
      s: "探讨 AI 能力边界及其社会影响。核心行动建议：「尽快前往事情正在发生的地方参与进去」；梳理 AI 时代个人核心能力与具体技术路线。",
      g: ["AI时代", "个人定位", "行动力"] },
    { id: "bi-ai", t: "bi & ai（视觉与听觉）", c: 0, k: "GR9QwOHmhivm0pkeCgVcTiQtnKe",
      s: "AI 感知机制技术笔记：人类听觉机制与短时傅里叶变换、梅尔谱等技术如何帮助 AI 模拟听觉特征，多模态编码与表征推理记录。",
      g: ["AI感知", "傅里叶变换", "多模态"] },
    { id: "emd-explore", t: "AI for EMD（探索篇）", c: 0, k: "E64HwqFjkizNkTkNucFcMmSLnTd",
      s: "AI 应用于电磁器件的创业探索：聚焦天线、滤波器的 AI 辅助设计，核心问题是「什么东西只有我能做」，梳理技术路径与创业可控性要素。",
      g: ["AI+硬科技", "电磁器件", "商业壁垒"] },
    { id: "emd-3t", t: "AI for EMD 的过去、现在、未来", c: 0, k: "B7GAw1FCZilCu3k7cmAc9MHFnFc",
      s: "AI × 电磁器件两大技术路径：代理模型（毫秒级预测）与逆向设计（性能→拓扑直出）。下一步：调研天线带宽方向并跑通端到端 demo。",
      g: ["代理模型", "逆向设计", "端到端"] },
    { id: "pengcheng", t: "鹏城 AI 汇报", c: 0, k: "ZPDgwGYWfiD7NpkiVdEcC76unjg",
      s: "面向鹏城实验室的进展汇报，采用「破-立-信-要」框架。核心命题：AI 重构 EMS 生产力；梳理可用资源与所需资源。",
      g: ["AI汇报", "EMS生产力", "破立信要"] },
    { id: "cst-platform", t: "CST Platform", c: 0, k: "VGfIwNR8ditOG5kWlpScyxL1nhh",
      s: "基于 CST 构建 AI Agent 建模平台：让 Agent 根据文献自动重建天线模型，每天消化 2 篇论文、积累 20+ 建模案例。",
      g: ["AI建模", "Agent自动化", "论文复现"] },
    { id: "dc-class", t: "DC-class（达晨创投）", c: 0, k: "UgNGw6cWUiuNJOkrKkUcfGUgnGd",
      s: "达晨创投训练班申请材料：AI+微波器件直博生 × 从 0 到 1 创业经验，判断未来 3-5 年硬科技创投机会在于 AI 重构研发流程。",
      g: ["硬科技创投", "AI重构研发", "直博"] },
    { id: "productivity", t: "Productivity（工具栈）", c: 1, k: "MU1WwbKgIiaWcokjuHOcC5gpnKb",
      s: "全套生产力工具清单：办公协作、科研管理、AI 工具矩阵、创作工具、技术开发、媒体矩阵与人脉管理，个人效能体系的基础备忘录。",
      g: ["工具栈", "飞书", "生产力"] },
    { id: "decision", t: "有效决策工具课程", c: 1, k: "MX5UwKsu9i41cJk3YJncBDAFnsd",
      s: "核心工具「选择 ROI」：综合衡量全面收益与成本（含机会成本、长期价值、时间窗口）。关键是建立自己的选择框架，而非依赖他人判断。",
      g: ["决策工具", "选择ROI", "机会成本"] },
    { id: "money-path", t: "一、赚钱路径", c: 2, c2: 5, k: "WmuwwpyvYitpGxkwkpncMADwnEd",
      s: "「小挣青年」低风险赚钱方法论课程：理论源自《毛选》《精益创业》《低风险创业》，以社群真实案例帮助个人找到并验证赚钱路径。",
      g: ["赚钱路径", "低风险创业", "变现"] },
    { id: "monetize", t: "变现 & 变现路线", c: 2, k: "TEU5wVswkioy1zkeB6Bck1Wpn3c",
      s: "个人变现路径早期规划：以小红书公域持续输出为主线，同时探索其他渠道与合作模式，梳理变现逻辑与内容分发矩阵。",
      g: ["变现", "小红书", "公域"] },
    { id: "jieyue-strategy", t: "企业战略规划（界越未来）", c: 2, k: "AbO1wtuyyi0NGhkB3AqczMsrnOd",
      s: "界越未来三段式战略：前期获客-转化-交付闭环分润，中期社群运营与高阶产品，先铺量再深化，以保研咨询切入。",
      g: ["界越未来", "战略规划", "获客"] },
    { id: "media-plan", t: "自媒体布局", c: 2, k: "WAl3wbtPuijHlYk4t2ucahqUnEg",
      s: "自媒体方向规划：定位「迷茫时，别忘了 AI」，计划用 Coze 做视频剪辑与图文生成，聚焦 AI 辅助内容生产。",
      g: ["自媒体", "Coze", "AI内容"] },
    { id: "traffic-pool", t: "《流量池》", c: 2, k: "AxERwrrOci8EEYkKsqccYZHtn1d",
      s: "运营核心方法论：品牌三度模型、AARRR 增长模型、裂变运营体系与私域策略。一切产品皆可裂变，一切效果皆可溯源。",
      g: ["流量池", "AARRR", "裂变"] },
    { id: "participation", t: "《参与感》", c: 2, k: "MBhSwZ0Jyiidf3kQW1DcnGdVnbJ",
      s: "小米方法论：口碑三角（产品-媒体-用户关系）与三三法则，产品互动设计四要素（简单-获益-有趣-真实），先服务再运营。",
      g: ["参与感", "口碑", "社区运营"] },
    { id: "real-demand", t: "《真需求》", c: 2, k: "RYZNwg1X6iQCTTk4VNNcDrBZndh",
      s: "产品三命题：产品价值 = 功能 + 情绪 + 资产；你能帮到的人才叫人脉；「合理的是理性，不合理的是人性」——非理性需求才是抓手。",
      g: ["真需求", "产品价值", "非理性需求"] },
    { id: "island-econ", t: "《小岛经济学》", c: 2, c2: 5, k: "F5PnwMwSHiMR7gkvdUrcuydInpf",
      s: "极简经济学：自我牺牲→创造资本→提高生产力→满足更多需求。存储本质是抗风险，警惕通胀侵蚀，个人层面反向复利思维。",
      g: ["资本", "通货膨胀", "复利"] },
    { id: "lixiang-luo", t: "李想 × 罗永浩访谈", c: 2, k: "HWUtww7Cbir3dkkLO7PcOO2cnVc",
      s: "两个核心观点：对 AI 的真实体感来自生产环境中的真实数据；AI 时代超级个体可重构业务，但人的感知与表达能力不可替代。",
      g: ["AI体感", "超级个体", "人的价值"] },
    { id: "jieyue-story", t: "界越未来品牌故事", c: 2, k: "Vj2Gw3nM5iStwNkdpJ8cBjoOnf7",
      s: "品牌叙事主线：从支教播种到公司成立，再到夏令营落地与 AI 教育转型。品牌使命是「帮大学生找到自己」。",
      g: ["品牌故事", "大学生", "AI教育"] },
    { id: "luoxiao", t: "罗销的第一次觉醒", c: 3, k: "B2txwg99kidQv2kGArLcorqIntg",
      s: "深度对话探讨年轻人自卑与焦虑的根源——评价体系依附于外界。什么都想做好的人必定平庸；真正的独立需要内在价值坐标。",
      g: ["评价体系", "自我认知", "觉醒"] },
    { id: "road-choice", t: "道路抉择", c: 3, k: "OWPRwmV7XiJPJTkW9x1cXlkgnsg",
      s: "职业方向梳理对话：「用自己最擅长的，获得自己最想要的体验」。体验即意义，终极目标是自由。",
      g: ["职业方向", "天赋", "自由"] },
    { id: "meritocracy", t: "优绩主义之外", c: 3, k: "XGYGw6RAgiiaKYkCvIOcRKBLnrd",
      s: "以小镇做题家→直博→创业为脉络，反思「成绩兑换一切」的局限。新评价体系：见人、见产业、见世界；做人、做产品、做价值。",
      g: ["优绩主义", "评价体系", "认知升级"] },
    { id: "iteration", t: "迭代之路", c: 3, k: "Jcv0wpVJui6RCpktnm6cp6rmnRd",
      s: "以时间线记录成长关键节点与认知转变，核心信念「不怕失败，怕流程不清晰」，在科研与创业之间不断迭代寻找聚焦点。",
      g: ["迭代", "成长复盘", "聚焦"] },
    { id: "five-year", t: "5 年总线（初版）", c: 3, k: "XhQQwG3zoiYYaQkvW4FcugNNnpg",
      s: "5 年方向规划：AI（重构生产力）与 Web3（重构生产关系）双主线，涵盖健康、毕业、财富自由、亲密关系、自我成长五维度。",
      g: ["5年规划", "AI", "Web3"] },
    { id: "annual-2025", t: "2025 年报：仍在路上", c: 3, k: "EtUtwswByisEOZksL9Wc23FDnTe",
      s: "年度总结十大关键词与十大事件：电子科大访学、界越未来落地、开启博士生涯、联合创办 AgentAlpha；年度书单 10 本。",
      g: ["年度复盘", "AgentAlpha", "博士生涯"] },
    { id: "principles", t: "《原则》", c: 3, k: "JFFOw0hVuipaJikHZbFcMGbpnGf",
      s: "领导与管理的核心区分：领导找对方向和事，管理让合适的人做合适的事。结合 MBTI 分析团队人事匹配。",
      g: ["原则", "领导力", "团队"] },
    { id: "time-friend", t: "《把时间当作朋友》", c: 3, k: "Zn8uwJvG7idDtHkU7vEcz2I0nDb",
      s: "时间账本习惯（KA+KR+Time Expense）；以热爱驱动行为；警觉懒惰——「打苦工是回避困难的表现」，努力需要策略。",
      g: ["时间管理", "热爱", "心智"] },
    { id: "beyond-feelings", t: "《超越感觉》", c: 3, k: "Hi1iwW4NviitJjkSmJ2cIk5CnuO",
      s: "批判性思维框架：智商靠遗传，心智靠习得。把第一反应视为「待验证假设」，调查-解释-判断三步提升决策质量。",
      g: ["批判性思维", "心智", "假设验证"] },
    { id: "naval", t: "《纳瓦尔宝典》", c: 3, k: "EemcwkJmciObrekroFsc1i6Rnhd",
      s: "财富来自睡觉时仍能赚钱的资产；用天赋专长、责任感与杠杆积累财富；长期主义核心是复利。幸福：活在当下，健康＞时间＞金钱。",
      g: ["纳瓦尔", "杠杆", "复利"] },
    { id: "web3", t: "Web3", c: 4, k: "Ph0swspFGiZspuky1Q7c5zyGn2g",
      s: "基于区块链的去中心化互联网，与 AI、VR 并列三大风口。当前仍处早期，但资产价值已被验证；全球多元配置、寻找高赔率市场。",
      g: ["Web3", "区块链", "投资"] },
    { id: "high-growth", t: "《高维增长》", c: 4, c2: 5, k: "CCnXwSThvin4sXkY6GacMsLCnNe",
      s: "产业分析框架：「三势三力」高维站位方法论，产业观五大思维与七阶段周期模型，结合 AI+微波器件分析终端客户路径。",
      g: ["产业分析", "三势三力", "赛道"] },
    { id: "y2049", t: "《2049：未来 10000 天》", c: 4, k: "Ofr0wuGRIi9vZJkHEAmctI6Mnkz",
      s: "未来世界特征（无形、透明、模拟、脱媒）与个人准则（信任、开源、定制、酷）。人类独特价值在于突破式创新与长期判断。",
      g: ["未来", "AI边界", "人类价值"] },
    { id: "wealth-truth", t: "《财富的真相》", c: 4, c2: 5, k: "TWegwEFnkilliOkcAfNc2p3rnub",
      s: "财富是「时间的函数」：尽早持有更有价值的生产资料，路径是健康 + 持续学习（学-练-用-造）。知识优先级：生产＞销售＞投资。",
      g: ["财富", "生产资料", "学练用造"] },
    { id: "random-walk", t: "《随机漫步的傻瓜》", c: 4, c2: 5, k: "X8XQwWkl9ipQAZk4jrxc4XCqnGf",
      s: "当失败后果无法承受时，成功概率毫无意义——止损优先。信噪比与观察频次负相关；财富目标不必最多，但期望要为正、要稳健。",
      g: ["随机性", "止损", "风险"] },
    { id: "influence", t: "《影响力》", c: 5, k: "ISiawV35Ciz6kJkjHnTcwNdCnid",
      s: "六大心理武器（互惠、喜好、承诺一致、社会认同、权威、稀缺），双向结合销售话术与消费者心理防御，组合出击方能最大化。",
      g: ["影响力", "心理学", "稀缺"] },
    { id: "guanhu", t: "《关乎天下》", c: 5, k: "RNs5wuYbQieyWNkCN1vc6zl4n3X",
      s: "企业金字塔模型（道/谋断/人阵法）、领袖 vs 管理者职能、销售三步法与 S 曲线增长理论。销售本质是维系人而非订单。",
      g: ["领袖", "销售", "S曲线"] },
    { id: "python-math", t: "Python 与数学", c: 5, k: "C3lNwhUkZi59pLk0vVjcqSNnnxc",
      s: "Python 基础学习笔记（李笑来 + 小甲鱼 + Harvard 网课），并记录「听不懂」后的方法反思——先找目标代码再逆向理解。",
      g: ["Python", "自学", "编程入门"] },
    { id: "logic-world", t: "《世界的逻辑》（上）", c: 5, k: "WRUvwWvG9i0wW3kXW65cQUJInPd",
      s: "马兆远著，人类逻辑发展史：知识来源于对确定性的追求；语言的边界即思想的边界；知识累积靠逻辑——积累到临界点便相互连接成网络，引发「知识大爆炸」。本图谱即受此启发。",
      g: ["逻辑", "确定性", "哥德尔", "知识网络"] }
  ];

  /* ---- curated logical links: [docA, docB, why] ---- */
  var LINKS = [
    ["ai-learn", "python-math", "Python 入门是 AI 路线第一步"],
    ["ai-learn", "inflection", "《拐点》的行动建议落地为学习路线"],
    ["ai-learn", "bi-ai", "深度学习 × 感知机制"],
    ["python-math", "time-friend", "同源于李笑来的自学方法论"],
    ["prompt", "ai-manual", "AI 工具使用策略互补"],
    ["prompt", "productivity", "Claude 是工具栈的核心"],
    ["ai-manual", "productivity", "工具矩阵 × 使用边界"],
    ["agent-coop", "traffic-pool", "「三度体系」方法论同源"],
    ["inflection", "y2049", "AI 边界与人类独特价值"],
    ["inflection", "lixiang-luo", "AI 体感与行动力"],
    ["emd-explore", "emd-3t", "同一条 AI×电磁器件主线"],
    ["emd-explore", "pengcheng", "EMS 生产力的对外汇报"],
    ["emd-3t", "cst-platform", "代理模型 → Agent 自动建模落地"],
    ["emd-explore", "high-growth", "产业分析框架的实战应用"],
    ["dc-class", "high-growth", "硬科技创投的产业观"],
    ["dc-class", "emd-explore", "AI 重构研发的创业叙事"],
    ["pengcheng", "iteration", "第一次汇报是迭代之路的关键节点"],
    ["decision", "beyond-feelings", "决策质量取决于批判性思维"],
    ["decision", "random-walk", "机会成本 × 止损策略"],
    ["money-path", "monetize", "变现路径的课程与实践"],
    ["monetize", "media-plan", "小红书内容矩阵"],
    ["media-plan", "participation", "自媒体的内容运营逻辑"],
    ["traffic-pool", "participation", "增长裂变 × 口碑运营互补"],
    ["traffic-pool", "influence", "心理武器驱动裂变"],
    ["jieyue-strategy", "jieyue-story", "界越未来：战略 × 品牌"],
    ["jieyue-strategy", "money-path", "低风险创业的闭环设计"],
    ["real-demand", "influence", "用户心理：需求与说服"],
    ["real-demand", "participation", "产品设计 × 用户参与"],
    ["island-econ", "wealth-truth", "资本与生产资料"],
    ["wealth-truth", "naval", "财富 = 资产与杠杆"],
    ["wealth-truth", "random-walk", "稳健与正期望"],
    ["naval", "five-year", "长期主义与复利规划"],
    ["web3", "five-year", "AI × Web3 双主线"],
    ["luoxiao", "meritocracy", "评价体系的破与立"],
    ["luoxiao", "road-choice", "咨询对话：帮人找到自己"],
    ["road-choice", "jieyue-story", "「帮大学生找到自己」的使命"],
    ["annual-2025", "iteration", "年度复盘 × 成长时间线"],
    ["principles", "guanhu", "领袖与管理者之辨"],
    ["time-friend", "beyond-feelings", "心智是习得的"],
    ["logic-world", "beyond-feelings", "逻辑学 × 批判性思维"],
    ["logic-world", "random-walk", "在不确定性中找支点"],
    ["logic-world", "dc-class", "创投 = 让正确的事发生"]
  ];

  /* ================= graph model ================= */
  var nodes = [], edges = [], byId = {};

  CATS.forEach(function (c, i) {
    var n = { id: "hub-" + c.key, hub: true, cat: i, title: c.name, r: 18, deg: 0,
              x: 0, y: 0, vx: 0, vy: 0 };
    nodes.push(n); byId[n.id] = n;
  });
  DOCS.forEach(function (d) {
    var n = { id: d.id, hub: false, cat: d.c, cat2: (d.c2 !== undefined ? d.c2 : -1),
              title: d.t, url: WIKI + d.k, summary: d.s, tags: d.g, r: 6, deg: 0,
              x: 0, y: 0, vx: 0, vy: 0 };
    nodes.push(n); byId[n.id] = n;
  });

  function addEdge(a, b, type, label) {
    var na = byId[a], nb = byId[b];
    if (!na || !nb) return;
    edges.push({ a: na, b: nb, type: type, label: label || "" });
    na.deg++; nb.deg++;
  }
  DOCS.forEach(function (d) {
    addEdge(d.id, "hub-" + CATS[d.c].key, "cat");
    if (d.c2 !== undefined) addEdge(d.id, "hub-" + CATS[d.c2].key, "cat");
  });
  LINKS.forEach(function (l) { addEdge(l[0], l[1], "logic", l[2]); });

  nodes.forEach(function (n) {
    if (!n.hub) n.r = 6.5 + Math.min(5, (n.deg - 1) * 1.0);
  });

  var neighbors = {};
  nodes.forEach(function (n) { neighbors[n.id] = []; });
  edges.forEach(function (e) {
    neighbors[e.a.id].push({ n: e.b, e: e });
    neighbors[e.b.id].push({ n: e.a, e: e });
  });

  /* ================= DOM ================= */
  var wrap = document.getElementById("kb-graph");
  if (!wrap) return;
  var canvas = wrap.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var tooltip = document.getElementById("kb-tooltip");
  var detail = document.getElementById("kb-detail");
  var legend = document.getElementById("kb-legend");
  var statEl = document.getElementById("kb-stats");

  if (statEl) {
    statEl.textContent = DOCS.length + " 篇文档 · " + LINKS.length + " 条逻辑联结 · " + CATS.length + " 大类";
  }

  /* ---- theme colors (re-read on theme switch) ---- */
  var theme = {};
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    theme.bg = cs.getPropertyValue("--bg").trim();
    theme.fg = cs.getPropertyValue("--fg").trim();
    theme.fg2 = cs.getPropertyValue("--fg-2").trim();
    theme.fg3 = cs.getPropertyValue("--fg-3").trim();
    theme.cats = [];
    for (var i = 0; i < 6; i++) theme.cats.push(cs.getPropertyValue("--kb-c" + i).trim());
  }
  readTheme();

  /* legend chips */
  var catFilter = -1;
  CATS.forEach(function (c, i) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "kb-chip";
    chip.innerHTML = '<i></i>' + c.name;
    chip.querySelector("i").style.background = theme.cats[i];
    chip.addEventListener("click", function () {
      catFilter = (catFilter === i) ? -1 : i;
      legend.querySelectorAll(".kb-chip").forEach(function (el, j) {
        el.classList.toggle("on", j === catFilter);
      });
      draw();
    });
    legend.appendChild(chip);
  });
  function refreshChipColors() {
    legend.querySelectorAll(".kb-chip i").forEach(function (el, j) {
      el.style.background = theme.cats[j];
    });
  }

  new MutationObserver(function () { readTheme(); refreshChipColors(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ================= layout ================= */
  var W = 0, H = 0, dpr = 1;
  function resize() {
    var w = wrap.clientWidth;
    var h = Math.max(500, Math.min(780, Math.round(w * 0.74)));
    dpr = window.devicePixelRatio || 1;
    W = w; H = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + "px";
    draw();
  }

  /* seed positions: hubs on an ellipse, docs jittered near their hub */
  function seed() {
    var cx = W / 2, cy = H / 2;
    CATS.forEach(function (c, i) {
      var a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      var h = byId["hub-" + c.key];
      h.x = cx + Math.cos(a) * W * 0.34;
      h.y = cy + Math.sin(a) * H * 0.36;
    });
    nodes.forEach(function (n) {
      if (n.hub) return;
      var h = byId["hub-" + CATS[n.cat].key];
      n.x = h.x + (Math.random() - 0.5) * 120;
      n.y = h.y + (Math.random() - 0.5) * 90;
    });
  }

  /* ---- force simulation ---- */
  var alpha = 0, running = false;
  function tick() {
    var i, j, n, m, e, dx, dy, d2, d, f;
    /* repulsion */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        m = nodes[j];
        dx = n.x - m.x; dy = n.y - m.y;
        d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
        if (d2 > 120000) continue;
        var rep = (n.hub && m.hub) ? 26000 : (n.hub || m.hub) ? 5200 : 2600;
        f = rep / d2 * alpha;
        d = Math.sqrt(d2);
        dx /= d; dy /= d;
        n.vx += dx * f; n.vy += dy * f;
        m.vx -= dx * f; m.vy -= dy * f;
      }
    }
    /* springs */
    for (i = 0; i < edges.length; i++) {
      e = edges[i];
      dx = e.b.x - e.a.x; dy = e.b.y - e.a.y;
      d = Math.sqrt(dx * dx + dy * dy) || 1;
      var rest = e.type === "cat" ? 128 : 175;
      f = (d - rest) * (e.type === "cat" ? 0.045 : 0.02) * alpha * 2.2;
      dx /= d; dy /= d;
      e.a.vx += dx * f; e.a.vy += dy * f;
      e.b.vx -= dx * f; e.b.vy -= dy * f;
    }
    /* gravity toward center + integrate */
    var cx = W / 2, cy = H / 2;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.vx += (cx - n.x) * 0.0020 * alpha * 2;
      n.vy += (cy - n.y) * 0.0038 * alpha * 2;
      if (n !== dragNode) {
        n.vx *= 0.82; n.vy *= 0.82;
        n.x += n.vx; n.y += n.vy;
      }
      var pad = n.r + 16;
      var padB = n.r + (n.hub ? 44 : 34); /* room for the label below */
      if (n.x < pad + 30) n.x = pad + 30; if (n.x > W - pad - 30) n.x = W - pad - 30;
      if (n.y < pad) n.y = pad; if (n.y > H - padB) n.y = H - padB;
    }
    alpha *= 0.985;
  }
  function loop() {
    if (alpha > 0.004) {
      tick(); draw();
      requestAnimationFrame(loop);
    } else { running = false; draw(); }
  }
  function heat(a) {
    alpha = Math.max(alpha, a);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  /* ================= rendering ================= */
  var hoverNode = null, selNode = null;

  function nodeColor(n) { return theme.cats[n.cat]; }

  function dimmed(n) {
    if (catFilter >= 0 && n.cat !== catFilter && n.cat2 !== catFilter) {
      if (!(n.hub && n.cat === catFilter)) return true;
    }
    var focus = hoverNode || selNode;
    if (focus) {
      if (n === focus) return false;
      var nb = neighbors[focus.id];
      for (var i = 0; i < nb.length; i++) if (nb[i].n === n) return false;
      return true;
    }
    return false;
  }
  function edgeActive(e) {
    var focus = hoverNode || selNode;
    if (focus) return (e.a === focus || e.b === focus);
    return false;
  }
  function edgeDimmed(e) {
    var focus = hoverNode || selNode;
    if (focus && !(e.a === focus || e.b === focus)) return true;
    if (catFilter >= 0) {
      var aIn = e.a.cat === catFilter || e.a.cat2 === catFilter;
      var bIn = e.b.cat === catFilter || e.b.cat2 === catFilter;
      if (!(aIn && bIn)) return true;
    }
    return false;
  }

  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var focus = hoverNode || selNode;

    /* edges */
    edges.forEach(function (e) {
      var act = edgeActive(e), dim = edgeDimmed(e);
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      if (e.type === "cat") {
        ctx.strokeStyle = theme.fg3;
        ctx.globalAlpha = dim ? 0.06 : (act ? 0.65 : 0.24);
        ctx.lineWidth = act ? 1.5 : 1;
      } else {
        var col = nodeColor(e.a.hub ? e.b : e.a);
        ctx.strokeStyle = act ? col : theme.fg2;
        ctx.globalAlpha = dim ? 0.07 : (act ? 0.95 : 0.44);
        ctx.lineWidth = act ? 2 : 1.3;
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* nodes */
    nodes.forEach(function (n) {
      var dim = dimmed(n);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor(n);
      ctx.globalAlpha = dim ? 0.14 : 1;
      ctx.fill();
      /* 2px surface ring separates overlapping marks */
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.bg;
      ctx.stroke();
      if (n === selNode || n === hoverNode) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColor(n);
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      if (n.hub && n.cat2 === undefined) { /* no-op, keeps shape simple */ }
      ctx.globalAlpha = 1;
    });

    /* cross-listed docs get a tiny second-color ring (identity is never color-alone anyway: labels + detail) */
    nodes.forEach(function (n) {
      if (n.hub || n.cat2 < 0 || dimmed(n)) return;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = theme.cats[n.cat2];
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    /* labels — greedy declutter, hubs & focus first */
    var placed = [];
    function tryLabel(n, force) {
      var text = n.title;
      var size = n.hub ? 13.5 : 11.5;
      ctx.font = (n.hub ? "600 " : "") + size + 'px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
      var wpx = ctx.measureText(text).width;
      var x = n.x - wpx / 2, y = n.y + n.r + (n.hub ? 16 : 13);
      var box = { x0: x - 3, x1: x + wpx + 3, y0: y - size, y1: y + 3 };
      if (!force) {
        for (var i = 0; i < placed.length; i++) {
          var b = placed[i];
          if (box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0) return;
        }
      }
      placed.push(box);
      var dim = dimmed(n);
      ctx.globalAlpha = dim ? 0.15 : (n.hub ? 1 : 0.9);
      ctx.fillStyle = n.hub ? theme.fg : theme.fg2;
      /* halo for readability */
      ctx.strokeStyle = theme.bg;
      ctx.lineWidth = 3;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    }
    var focusSet = [];
    if (focus) {
      focusSet.push(focus);
      neighbors[focus.id].forEach(function (nb) { focusSet.push(nb.n); });
    }
    focusSet.forEach(function (n) { tryLabel(n, true); });
    nodes.filter(function (n) { return n.hub && focusSet.indexOf(n) < 0; })
         .forEach(function (n) { tryLabel(n, false); });
    nodes.filter(function (n) { return !n.hub && focusSet.indexOf(n) < 0; })
         .sort(function (a, b) { return b.deg - a.deg; })
         .forEach(function (n) { tryLabel(n, false); });
  }

  /* ================= interaction ================= */
  function pos(ev) {
    var r = canvas.getBoundingClientRect();
    var p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  }
  function pick(p) {
    /* hit target bigger than the mark */
    var best = null, bestD = 1e9;
    nodes.forEach(function (n) {
      var dx = n.x - p.x, dy = n.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < Math.max(n.r + 8, 14) && d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  var dragNode = null, dragged = false;

  canvas.addEventListener("pointerdown", function (ev) {
    var n = pick(pos(ev));
    if (n) {
      dragNode = n; dragged = false;
      canvas.setPointerCapture(ev.pointerId);
    }
  });
  canvas.addEventListener("pointermove", function (ev) {
    var p = pos(ev);
    if (dragNode) {
      dragNode.x = p.x; dragNode.y = p.y;
      dragNode.vx = 0; dragNode.vy = 0;
      dragged = true;
      heat(0.06);
      return;
    }
    var n = pick(p);
    if (n !== hoverNode) {
      hoverNode = n;
      canvas.style.cursor = n ? "pointer" : "default";
      draw();
    }
    if (n && tooltip) {
      tooltip.textContent = n.hub ? n.title + "（分类枢纽）" : n.title;
      tooltip.style.display = "block";
      var tw = tooltip.offsetWidth;
      var tx = Math.min(Math.max(p.x - tw / 2, 4), W - tw - 4);
      tooltip.style.left = tx + "px";
      tooltip.style.top = (n.y - n.r - 34) + "px";
    } else if (tooltip) {
      tooltip.style.display = "none";
    }
  });
  canvas.addEventListener("pointerup", function (ev) {
    if (dragNode && !dragged) select(dragNode);
    dragNode = null;
  });
  canvas.addEventListener("pointerleave", function () {
    hoverNode = null;
    if (tooltip) tooltip.style.display = "none";
    draw();
  });

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function select(n) {
    selNode = (selNode === n) ? null : n;
    draw();
    renderDetail();
  }

  function renderDetail() {
    if (!detail) return;
    var n = selNode;
    if (!n) {
      detail.innerHTML = '<div class="kb-detail-empty">点击节点查看文档摘要与它的逻辑联结；拖拽节点可以重新布局。</div>';
      return;
    }
    var col = nodeColor(n);
    var html = "";
    if (n.hub) {
      var cat = CATS[n.cat];
      var members = nodes.filter(function (m) {
        return !m.hub && (m.cat === n.cat || m.cat2 === n.cat);
      });
      html += '<div class="kb-detail-cat" style="color:' + col + '">' + esc(cat.tag) + "</div>";
      html += '<h4>' + esc(cat.name) + '<span class="kb-detail-count">' + members.length + " 篇</span></h4>";
      html += '<ul class="kb-detail-links">';
      members.forEach(function (m) {
        html += '<li><a href="#" data-node="' + m.id + '">' + esc(m.title) + "</a></li>";
      });
      html += "</ul>";
    } else {
      html += '<div class="kb-detail-cat" style="color:' + col + '">' + esc(CATS[n.cat].tag) +
        (n.cat2 >= 0 ? ' <em>· 同时收录于「' + esc(CATS[n.cat2].name) + '」</em>' : "") + "</div>";
      html += "<h4>" + esc(n.title) + "</h4>";
      html += "<p>" + esc(n.summary) + "</p>";
      html += '<div class="kb-detail-tags">' + n.tags.map(function (t) {
        return "<span>" + esc(t) + "</span>";
      }).join("") + "</div>";
      var logic = neighbors[n.id].filter(function (nb) { return nb.e.type === "logic"; });
      if (logic.length) {
        html += '<div class="kb-detail-sub">逻辑联结</div><ul class="kb-detail-links">';
        logic.forEach(function (nb) {
          html += '<li><a href="#" data-node="' + nb.n.id + '">' + esc(nb.n.title) + "</a>" +
            '<span class="kb-detail-why">' + esc(nb.e.label) + "</span></li>";
        });
        html += "</ul>";
      }
      html += '<a class="kb-detail-open" href="' + n.url + '" target="_blank" rel="noopener">在飞书中阅读原文 ↗</a>';
    }
    detail.innerHTML = html;
    detail.querySelectorAll("a[data-node]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var m = byId[a.getAttribute("data-node")];
        if (m) { selNode = m; draw(); renderDetail(); }
      });
    });
  }

  /* ================= boot ================= */
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    resize();
    seed();
    heat(1);
    renderDetail();
  }

  window.addEventListener("resize", function () {
    if (!booted) return;
    var oldW = W;
    resize();
    if (Math.abs(W - oldW) > 40) { seed(); heat(0.8); }
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { boot(); io.disconnect(); }
      });
    }, { rootMargin: "200px" });
    io.observe(wrap);
  } else {
    boot();
  }
})();
