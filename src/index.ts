import { browserAgent, codeGenAgent } from "./agents";
import {
  VoltAgent,
  Agent,
  createHooks,
  InMemoryStorage,
  createPrompt,
} from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { mistral } from "@ai-sdk/mistral";
import { calculatorTool, weatherTool } from "./tools";

// Define the hooks using createHooks
const hooks = createHooks({
  // Called when any agent interaction starts (generateText, streamText, etc.)
  onStart: async (agentInstance) => {
    console.log(`Agent ${agentInstance.name} starting interaction...`);
  },
  // Called when the interaction successfully finishes
  onEnd: async (agentInstance, result) => {
    // Result format depends on the method called (e.g., { text: ..., usage: ... } for generateText)
    console.log(
      `Agent ${agentInstance.name} finished. Final output:`,
      result.text || result.object
    );
  },
  onToolStart(_, tool) {
    console.log(`Tool starting: ${tool.name}`);
  },
  onToolEnd(_, tool, result) {
    console.log(`Tool completed: ${tool.name}`);
    console.log(`Result: ${JSON.stringify(result)}`);
  },

  onHandoff: async (targetAgent, sourceAgent) => {
    // 'sourceAgent' is the supervisor, 'targetAgent' is the subagent receiving the task
    console.log(
      `Task being handed off from ${sourceAgent.name} to ${targetAgent.name}`
    );
    // --- Use Cases ---
    // 1. Logging: Log detailed information about the handoff for debugging/monitoring.
    // 2. Validation: Check if the handoff is appropriate based on agent capabilities or context.
    // 3. Context Modification: Potentially modify the context being passed (though direct modification isn't standard, you could trigger external updates).
    // 4. Notification: Send notifications about task delegation.
  },
});

// Initialize InMemoryStorage
const memory = new InMemoryStorage({
  // Optional: Limit the number of messages stored per conversation thread
  storageLimit: 100, // Defaults to no limit if not specified

  // Optional: Enable verbose debug logging from the memory provider
  debug: true, // Defaults to false
});

const agentPrompt = createPrompt({
  template: `You are a planner agent responsible for orchestrating web automation and test generation workflows.

YOUR ROLE:
- Break down user requests into clear, sequential steps
- Delegate specialized tasks to appropriate sub-agents
- Coordinate the overall execution flow
- Ensure tasks are completed efficiently

AGENT CAPABILITIES:
- FIRST TASK: Open a browser session and navigate to a specified URL
- SECOND TASK: Perform interactions like clicking, typing, and data extraction
- THIRD TASK: Generate Playwright test scripts based on recorded actions
- FOURTH TASK: Validate and verify the results of interactions
- FIFTH TASK: Handle errors and exceptions gracefully
- SIXTH TASK: Maintain a single browser session for all tasks
- SEVENTH TASK: Close the browser session when all tasks are complete
- EIGHTH TASK: Provide feedback and results to the user
- NINTH TASK: Log all actions and results for debugging and auditing
- TENTH TASK: Ensure the browser is closed only when explicitly requested
- ELEVENTH TASK: Use the existing browser instance and do not open multiple browsers
- TWELFTH TASK: Open only one instance of the browser and reuse it for all operations
- THIRTEENTH TASK: Use the existing page when possible
- FOURTEENTH TASK: Close the browser only when explicitly requested
- FIFTEENTH TASK: Use reliable selectors (preferably role, text, testid)
- SIXTEENTH TASK: Wait for elements before interacting with them
- SEVENTEENTH TASK: Handle errors gracefully
- EIGHTEENTH TASK: Validate outcomes of actions
- NINETEENTH TASK: Use the existing browser instance and do not open multiple browsers
- TWENTIETH TASK: Open only one instance of the browser and reuse it for all operations
- TWENTY-FIRST TASK: Use the existing page when possible

TASK CATEGORIES:
- Navigation: Opening websites, moving between pages, refreshing (Use browserAgent)
- Interaction: Clicking elements, filling forms, extracting data (Use browserAgent)
- CodeGen: Recording actions and generating Playwright test scripts (Use codegenAgent)

COORDINATION RULES:
- Start with navigation tasks before interaction
- Record actions first before generating test code
- Maintain a single browser session throughout tasks
- Verify completion of each step before proceeding

PLANNING APPROACH:
1. Analyze the user request
2. Break it down into ordered steps by category
3. Delegate each step to the appropriate agent
4. Collect and integrate results

Your current goal is: {{goal}}
Available context: {{context}}
Task: {{task}}`,
  variables: {
    goal: "Plan and coordinate browser automation and test generation",
    context: "Working with multiple specialized agents",
    task: "", // Default task is empty
  },
});
// Create an agent with multiple tools
const multiToolAgent = new Agent({
  name: "Multi-Tool Assistant",
  description:
    "An advanced assistant specializing in web test automation and code generation. Use browserAgent or browser tools for running Playwright tests and web automation tasks. Use codegenAgent for generating TypeScript test scripts from browser sessions. The tools can help with browser-based test automation, data validation, and generating maintainable TypeScript code for Playwright tests.",
  //prompt: agentPrompt,
  llm: new VercelAIProvider(),
  model: mistral("mistral-large-latest"),
  subAgents: [browserAgent, codeGenAgent],
  hooks: hooks,
  /*
  memory: memory,
  observability: {
    logLevel: "debug", // Set the log level for observability
    logToConsole: true, // Log to console
    logToFile: false, // Log to a file
    logToExternalService: false, // Log to an external service
  },*/
});

// Initialize the VoltAgent - this was commented out, which is likely preventing proper initialization
const voltAgent = new VoltAgent({
  agents: {
    agent: multiToolAgent,
  },
});
/*
// Wrap top-level await expressions in an async function
(async () => {
  try {
    console.log("Starting browser automation tasks...");

    // Example 1: Use the agent to automate a browser task
    const browserTaskResponse = await multiToolAgent.generateText(
      "Go to wikipedia.org, search for 'Playwright automation', take a screenshot, and save it to results.png"
    );
    console.log("Browser task completed:");
    console.log(browserTaskResponse.text);

    // Add a delay to ensure the first task completes fully
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example 2: Generate and run a Playwright test
    const testGenerationResponse = await multiToolAgent.generateText(
      "Start recording a test session, go to example.com, verify the page title is 'Example Domain', and generate a test script"
    );
    console.log("Test generation completed:");
    console.log(testGenerationResponse.text);
  } catch (error) {
    console.error("Error executing agent tasks:", error);
  }
})();
*/
