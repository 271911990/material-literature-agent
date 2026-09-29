# Material Literature Agent

材料文献分析子智能体（Material Literature Analysis Agent）。

这是一个基于 Pi Coding Agent 的材料科学文献分析 Package，用于从材料科学论文、实验报告和技术资料中提取材料体系、结构、制备工艺、性能数据、实验条件和主要结论，并以结构化形式返回分析结果。

## 功能

Material Literature Agent 主要完成以下任务：

- 提取文献基本信息
- 识别材料体系和化学组成
- 提取晶体结构、相组成和微观组织信息
- 提取材料制备和加工工艺
- 提取实验温度、时间、压力等条件
- 整理材料性能数据
- 区分文献事实和分析判断
- 标记文献中的信息缺失
- 建立实验数据的证据索引

## 项目结构

```text
material-literature-agent/
├── agents/
│   └── material-literature.md
├── extensions/
│   └── material-literature-agent.ts
├── package.json
├── README.md
├── LICENSE
├── 锂离子电池正极材料磷酸铁锂的研究进展_王甲泰_2104834922995011584.md
└── 材料文献分析 Agent 实验报告.md
```
