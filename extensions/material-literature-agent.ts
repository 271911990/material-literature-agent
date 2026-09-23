import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentPromptPath = path.resolve(
  __dirname,
  "..",
  "agents",
  "material-literature.md",
);

export default function (pi: any) {
  pi.registerTool({
    name: "material_literature_agent",

    label: "材料文献分析 Agent",

    description:
      "调用材料文献分析子 Agent，读取并分析材料科学论文、实验报告和技术资料，提取材料体系、结构、制备工艺、性能数据、实验条件、主要结论和证据位置。子 Agent 仅拥有只读工具。",

    parameters: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description:
            "需要材料文献分析 Agent 完成的具体任务。",
        },
      },
      required: ["task"],
      additionalProperties: false,
    },

    async execute(
      _toolCallId: string,
      params: { task: string },
      signal: AbortSignal,
    ) {
      const agentPrompt = await readFile(agentPromptPath, "utf-8");

      const fullPrompt = `
你现在作为“材料文献分析 Agent”工作。

以下是你的工作规范：

${agentPrompt}

---

请完成下面的任务：

${params.task}

请严格按照工作规范完成任务。
`;

        return await new Promise((resolve, reject) => {
            const piArgs = [
              "--no-session",
              "--tools",
              "read,grep,find,ls",
              "--thinking",
              "off",
              "--system-prompt",
              fullPrompt,
              "-p",
              params.task,
            ];

            // pi 进程本身通过 `node <cli.js>` 启动（见全局 pi / pi.cmd 包装脚本）。
            // 直接复用 process.argv[1]（即 cli.js）并用 process.execPath（node）调用，
            // 可避免 Windows 上 spawn `.cmd` 包装脚本导致的 EINVAL，
            // 同时多行 system prompt 以 argv 原样传递、不经过 shell，避免被破坏。
            const piEntry = process.argv[1];
            const useNodeEntry =
              typeof piEntry === "string" && /\.(?:js|mjs|cjs)$/i.test(piEntry);

            const child = spawn(
              useNodeEntry
                ? process.execPath
                : process.platform === "win32"
                  ? "pi.cmd"
                  : "pi",
              useNodeEntry ? [piEntry, ...piArgs] : piArgs,
              {
                cwd: process.cwd(),
                stdio: ["ignore", "pipe", "pipe"],
                windowsHide: true,
              },
            );
  
        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        const abortHandler = () => {
          child.kill();
          reject(new Error("材料文献分析 Agent 已被中止。"));
        };

        signal?.addEventListener("abort", abortHandler, { once: true });

        child.on("error", (error) => {
          signal?.removeEventListener("abort", abortHandler);
          reject(error);
        });

        child.on("close", (code) => {
          signal?.removeEventListener("abort", abortHandler);

          if (code !== 0) {
            reject(
              new Error(
                `材料文献分析 Agent 执行失败。\n退出码: ${code}\n${stderr}`,
              ),
            );
            return;
          }

          resolve({
            content: [
              {
                type: "text",
                text: stdout || "Agent 没有返回文本结果。",
              },
            ],
            details: {
              agent: "material-literature",
              tools: ["read", "grep", "find", "ls"],
            },
          });
        });
      });
    },
  });
}