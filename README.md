# 世界完蛋了指数 (Global Disorder Index)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-v1.1-blue.svg)](./CHANGELOG.md)

> 一个基于多维度数据的全球混乱程度实时追踪系统

## 🌍 简介

**世界完蛋了指数 (Global Disorder Index / GDI)** 是一个开源的数据可视化项目，旨在通过量化分析全球各大冲突、危机和不稳定因素，计算出一个综合性的"世界混乱指数"。

该指数整合了战争、地缘政治冲突、经济危机、气候灾难、社交媒体情绪等多维度数据，为研究人员、投资者和关心全球局势的用户提供一个直观的世界"健康度"指标。

## 📊 指数构成

GDI 由以下六大核心维度构成：

### 1. 🔥 地缘政治冲突 (Geopolitical Conflict) - 权重: 25%
- 活跃战争数量
- 军事冲突烈度
- 核武器威胁等级
- 国际制裁数量

### 2. 💰 经济与金融 (Economic Crisis) - 权重: 20%
- 全球股市波动率
- 主要货币汇率波动
- 能源价格异常
- 通货膨胀率

### 3. 🌊 气候与环境 (Climate & Environment) - 权重: 15%
- 极端天气事件频率
- 自然灾害影响范围
- 海平面上升数据
- 生物多样性丧失速度

### 4. 🦠 公共卫生 (Public Health) - 权重: 15%
- 大流行病传播等级
- 医疗系统压力指数
- 疫苗接种覆盖率变化

### 5. 📱 社会情绪 (Social Sentiment) - 权重: 15%
- 社交媒体负面情绪比例
- 抗议活动频率
- 政治极化程度

### 6. 🤖 AI 风险 (AI Risk) - 权重: 10%
- AI 安全事件
- 自主武器系统部署
- AI 引发的经济冲击

## 🚀 快速开始

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/josepumpbtc/global-disorder-index.git
cd global-disorder-index

# 安装依赖
pip install -r requirements.txt

# 启动系统
python main.py
```

### Docker 部署

```bash
docker build -t global-disorder-index .
docker run -p 8080:8080 global-disorder-index
```

## 📁 项目结构

```
global-disorder-index/
├── 📄 PRD-v1.1.md              # 产品需求文档
├── 📁 src/
│   ├── 📁 collectors/          # 数据采集器
│   │   ├── war_collector.py
│   │   ├── economic_collector.py
│   │   ├── climate_collector.py
│   │   └── sentiment_collector.py
│   ├── 📁 processors/          # 数据处理
│   │   ├── index_calculator.py
│   │   └── weight_adjuster.py
│   ├── 📁 api/                 # API 接口
│   │   └── server.py
│   └── 📁 dashboard/           # 可视化面板
│       └── web/
├── 📁 data/                    # 数据存储
├── 📁 tests/                   # 测试用例
├── 📁 docs/                    # 文档
├── README.md
└── requirements.txt
```

## 🎯 使用场景

- **投资者**: 评估全球市场风险，调整投资组合
- **研究人员**: 分析全球冲突趋势和模式
- **媒体**: 追踪和报道全球危机发展
- **政策制定者**: 监测国际安全形势

## 📈 API 接口

```bash
# 获取当前 GDI 指数
GET /api/v1/index/current

# 获取历史数据
GET /api/v1/index/history?days=30

# 获取各维度分解数据
GET /api/v1/components

# 订阅实时推送
WS /api/v1/stream
```

## 🤝 贡献指南

我们欢迎各种形式的贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 📜 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

## ⚠️ 免责声明

本指数仅供信息参考，不构成投资建议。数据来源于公开渠道，可能存在延迟或不准确的情况。

---

**当前版本**: v1.1  
**最后更新**: 2026-03-25  
**维护者**: [@josepumpbtc](https://github.com/josepumpbtc)
