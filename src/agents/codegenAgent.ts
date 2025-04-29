import {
  startCodegenSessionTool,
  generateTestTool,
  endCodegenSessionTool,
  recordActionTool,
} from "./../tools/codegen";
import { Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { mistral } from "@ai-sdk/mistral";

// Create a specialized agent for code generation
export const codeGenAgent = new Agent({
  name: "Code Generation Agent",
  description:
    "You are an expert code generator. Write clean, efficient, and production-ready code.",
  llm: new VercelAIProvider(),
  model: mistral("mistral-large-latest"),
  tools: [
    startCodegenSessionTool,
    generateTestTool,
    endCodegenSessionTool,
    recordActionTool,
  ],
});
