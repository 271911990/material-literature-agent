# 材料文献分析 Agent 实验报告

## 一、实验目的

本实验的目标是基于 Pi Coding Agent，独立设计并实现一个面向材料科学文献分析的子 Agent，并将其封装为 Pi Package 发布到 GitHub。

本实验最终需要完成以下工作：

1. 设计材料文献分析 Agent 的功能和输出格式；
2. 编写 Agent 定义文件 `material-literature.md`；
3. 编写 TypeScript Extension，实现 Agent 的调用；
4. 限制子 Agent 的工具权限，使其只能读取和检索文献；
5. 完成 Agent 的本地测试和问题调试；
6. 使用 Git 管理项目并发布到 GitHub。

------

# 二、实验环境

本实验主要在 **Windows + Git Bash + VS Code** 环境下完成。

使用的软件及版本：

- Node.js：v24.21.0
- Pi Coding Agent：0.87.1
- Git：2.48.1.windows.1
- VS Code
- GitHub

项目目录为：

```text
material-literature-agent/
├── agents/
│   └── material-literature.md
├── extensions/
│   └── material-literature-agent.ts
├── LICENSE
├── README.md
└── package.json
```

------

# 三、材料文献分析 Agent 的设计

我首先根据实验要求确定了 Agent 的具体任务。

该 Agent 主要用于读取材料科学论文，并提取：

- 文献基本信息
- 材料体系
- 化学组成
- 晶体结构和微观组织
- 制备与加工工艺
- 实验条件
- 材料性能数据
- 主要实验结果
- 作者主要结论
- 材料设计启示

同时要求 Agent **不能虚构文献中不存在的信息**，并将“文献事实”和“分析判断”进行区分。

------

# 四、Agent 定义文件的编写

我在：

```text
agents/material-literature.md
```

中定义了材料文献分析 Agent。

文件首先通过 Front Matter 定义 Agent：

```markdown
---
name: material-literature
description: 材料文献分析子智能体。
tools: read, grep, find, ls
---
```

其中：

- `name` 定义 Agent 名称；
- `description` 说明 Agent 的功能；
- `tools` 限定 Agent 可以使用的工具。

随后在 Markdown 正文中进一步编写 Agent 的：

- 角色；
- 分析任务；
- 信息提取要求；
- 输出格式；
- 禁止事项。

------

# 五、TypeScript Extension 的编写

这是本实验的核心实现部分。

我在：

```text
extensions/material-literature-agent.ts
```

中编写 Extension，用于将材料文献分析 Agent 接入 Pi。

## 5.1 注册自定义工具

首先通过：

```typescript
pi.registerTool({
    name: "material_literature_agent",
    ...
});
```

向 Pi 注册了一个新的工具：

```text
material_literature_agent
```

这个工具接收一个 `task` 参数，用于描述主 Agent 希望材料文献分析 Agent 完成的任务。

例如：

```text
请分析当前目录中的论文，提取材料组成、制备工艺和性能数据。
```

------

## 5.2 读取 Agent 定义

Extension 会读取：

```text
agents/material-literature.md
```

并将其中规定的 Agent 工作规范加入新的 Prompt。

整体过程为：

```text
material-literature.md
        ↓
读取 Agent 工作规范
        ↓
加入当前分析任务
        ↓
形成完整 Prompt
```

------

## 5.3 启动独立子 Agent

Extension 使用 Node.js 的 `child_process` 启动新的 Pi 进程。

核心思路是：

```text
主 Pi
 ↓
调用 material_literature_agent
 ↓
Extension 接收 task
 ↓
启动新的 Pi 进程
 ↓
子 Agent 分析论文
 ↓
返回分析结果
```

为了限制子 Agent 的能力，在启动时指定：

```text
read,grep,find,ls
```

因此子 Agent 只具有：

- 读取文件；
- 搜索内容；
- 查找文件；
- 查看目录。

没有文件编辑和 Shell 执行权限。

------

# 六、Windows 环境下的问题与解决

在实际测试过程中，我发现最初通过：

```typescript
spawn("pi", ...)
```

启动子 Agent 时出现：

```text
spawn pi ENOENT
```

因此我对 Extension 的启动方式进行了修改。

最终通过：

```typescript
process.argv[1]
```

获取 Pi CLI 的入口文件，并使用：

```typescript
process.execPath
```

调用 Node.js 启动 Pi。

修改后重新运行测试，子 Agent 可以正常启动并返回分析结果。

这一过程完成了 Extension 从**代码编写 → 报错 → 定位问题 → 修改 → 重新验证**的完整调试。

------

# 七、Agent 功能测试

完成 Extension 后，我首先使用项目自身的 `package.json` 进行功能测试。

测试命令：

```bash
pi -e ./extensions/material-literature-agent.ts \
--approve \
-p "请读取当前项目中的 package.json，告诉我这个项目的名称、版本号，以及它配置了哪个 Pi extension。"
```

Agent 成功读取文件，并返回：

```text
name: material-literature-agent
version: 1.0.0
extension: ./extensions/material-literature-agent.ts
```

由此验证了：

```text
Pi
 ↓
Extension
 ↓
material_literature_agent
 ↓
独立子 Agent
 ↓
读取文件
 ↓
返回结果
```

整个调用过程可以正常运行。

![image-20260929153735154](%E6%9D%90%E6%96%99%E6%96%87%E7%8C%AE%E5%88%86%E6%9E%90%20Agent%20%E5%AE%9E%E9%AA%8C%E6%8A%A5%E5%91%8A.assets/image-20260929153735154.png)

------

# 八、真实材料文献测试

完成基本功能测试后，我进一步使用真实的材料科学文献对 Agent 进行测试。本次选取的测试文献为《锂离子电池正极材料磷酸铁锂的研究进展》，已将其 Markdown 文件放入项目目录中。

通过以下命令调用材料文献分析 Agent：

```bash
pi -e ./extensions/material-literature-agent.ts --approve -p "请使用材料文献分析 Agent 分析当前目录中的《锂离子电池正极材料磷酸铁锂的研究进展》论文，提取文献基本信息、材料体系、结构信息、制备工艺、性能数据、主要实验结果和作者结论，并按照 Agent 规定的格式输出。"
```

![image-20260929155938601](%E6%9D%90%E6%96%99%E6%96%87%E7%8C%AE%E5%88%86%E6%9E%90%20Agent%20%E5%AE%9E%E9%AA%8C%E6%8A%A5%E5%91%8A.assets/image-20260929155938601.png)

![image-20260929160059637](%E6%9D%90%E6%96%99%E6%96%87%E7%8C%AE%E5%88%86%E6%9E%90%20Agent%20%E5%AE%9E%E9%AA%8C%E6%8A%A5%E5%91%8A.assets/image-20260929160059637.png)

------


# 九、Package 封装与 GitHub 发布

完成 Agent 和 Extension 后，我将项目整理为 Pi Package。

通过 `package.json` 指定：

```json
"pi": {
    "extensions": [
        "./extensions/material-literature-agent.ts"
    ]
}
```

随后使用 Git 进行版本管理：

```bash
git init
git add .
git commit -m "Initial commit"
```

最终将项目发布至 GitHub：

[material-literature-agent GitHub Repository](https://github.com/271911990/material-literature-agent?utm_source=chatgpt.com)

最终仓库包含：

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
------

# 十、实验结果

本实验最终完成了一个可以实际运行的**材料文献分析 Agent Package**。

其完整工作流程为：

```text
用户提出材料文献分析任务
            ↓
        Pi 主 Agent
            ↓
调用 material_literature_agent
            ↓
       启动独立子 Agent
            ↓
读取 material-literature.md
            ↓
使用只读工具读取论文
            ↓
提取材料相关信息
            ↓
结构化生成分析结果
            ↓
      返回主 Agent
```

最终实现了从 **Agent 设计、代码实现、权限控制、实际测试、问题调试到 GitHub 发布**的完整流程。

------

## 十一、实验成果

本实验最终完成：

- ✅ 材料文献分析 Agent 设计
- ✅ `material-literature.md` 编写
- ✅ TypeScript Extension 编写
- ✅ `material_literature_agent` 工具注册
- ✅ 子 Agent 只读权限设置
- ✅ Windows 环境下 Extension 调试
- ✅ Agent 实际调用测试
- ✅ Pi Package 封装
- ✅ Git 版本管理
- ✅ GitHub 发布
- ⏳ **真实材料论文测试及结果截图**