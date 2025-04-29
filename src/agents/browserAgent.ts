import { Agent, createPrompt } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { GroqProvider } from "@voltagent/groq-ai";
import { mistral } from "@ai-sdk/mistral";
import {
  navigationTool,
  goBackTool,
  goForwardTool,
  refreshPageTool,
  closeBrowserTool,
  clickTool,
  typeTool,
  getTextTool,
  selectOptionTool,
  checkTool,
  uncheckTool,
  hoverTool,
  pressKeyTool,
  waitForElementTool,
  saveToFileTool,
  exportPdfTool,
  extractDataTool,
  expectResponseTool,
  assertResponseTool,
  screenshotTool,
  setUserAgentTool,
  getUserAgentTool,
  getVisibleTextTool,
  getVisibleHtmlTool,
  listInteractiveElementsTool,
} from "../tools/browser";

const agentPrompt = createPrompt({
  template: `You are an AI agent specialized in web automation with Playwright.

CAPABILITIES:
- Web navigation and interaction
- Element selection and manipulation
- Data extraction and validation
- Screenshot capture and PDF export
- Test script generation
{{capabilities}}

BROWSER MANAGEMENT:
- CRITICAL: Always use a SINGLE browser instance for all operations
- Do not launch new browser instances if one already exists
- Reuse the existing page when possible
- Close browser only when explicitly requested

BEST PRACTICES:
- Use reliable selectors (preferably role, text, testid)
- Wait for elements before interacting with them
- Handle errors gracefully
- Validate outcomes of actions
 IMPORTANT: Always use the existing browser instance and do not open multiple browsers. Open only one instance of the browser and reuse it for all operations. You can help users automate complex web tasks, retrieve information, validate website functionality, and generate test scripts for web applications.
Your current goal is: {{goal}}
Available context: {{context}}
Task: {{task}}`,
  variables: {
    capabilities: "web search, code execution",
    goal: "Perform web automation and testing",
    context: "Working with Playwright in a browser environment",
    task: "", // Default task is empty
  },
});

// Instantiate the provider, optionally passing the API key to overwrite the default process.env.GROQ_API_KEY
const groqProvider = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY,
});

// Create a specialized agent for browsing
export const browserAgent = new Agent({
  name: "Browser Agent",
  description:
    "You are an advanced web automation assistant with comprehensive capabilities. You can navigate websites, interact with page elements (clicking, typing, selecting options), capture screenshots, extract and process data, perform checks on responses, manipulate user agents, and export content in various formats.",
  llm: new VercelAIProvider(),
  model: mistral("mistral-large-latest"),
  //prompt: { agentPrompt },
  tools: [
    // Navigation tools
    navigationTool,
    goBackTool,
    goForwardTool,
    refreshPageTool,
    closeBrowserTool,

    //Interaction tools
    clickTool,
    typeTool,
    getTextTool,
    selectOptionTool,
    checkTool,
    uncheckTool,
    hoverTool,
    pressKeyTool,
    waitForElementTool,

    //Output tools
    saveToFileTool,
    exportPdfTool,
    extractDataTool,

    // Response tools
    expectResponseTool,
    assertResponseTool,

    // Screenshot tool
    screenshotTool,

    // User agent tools
    setUserAgentTool,
    getUserAgentTool,

    // Visibility tools
    getVisibleTextTool,
    getVisibleHtmlTool,
    listInteractiveElementsTool,
  ],
});
