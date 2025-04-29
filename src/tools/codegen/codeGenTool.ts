import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { playwrightGenerator } from "./generator";
import { CodegenOptions } from "./types";

/**
 * Tool for starting a new code generation session
 */
export const startCodegenSessionTool = createTool({
  name: "startCodegenSession",
  description:
    "Start a new session to record browser actions for test generation",
  parameters: z.object({
    outputPath: z
      .string()
      .optional()
      .describe("Directory where the generated tests will be saved"),
    testNamePrefix: z
      .string()
      .optional()
      .describe("Prefix for generated test names"),
    includeComments: z
      .boolean()
      .optional()
      .describe("Whether to include comments in the generated code"),
  }),
  execute: async (args, context) => {
    const options: CodegenOptions = {
      outputPath: args.outputPath,
      testNamePrefix: args.testNamePrefix,
      includeComments: args.includeComments,
    };

    // Use the merged playwrightGenerator instead of separate functions
    const session = playwrightGenerator.createSession(options);

    // Store session ID in the context for other tools to access
    const toolContext = context as unknown as ToolContext;
    toolContext.codegenSessionId = session.id;

    return {
      result: {
        sessionId: session.id,
        message:
          "Code generation session started. Browser actions will now be recorded for test generation.",
      },
    };
  },
});

/**
 * Tool for generating test code from the current session
 */
export const generateTestTool = createTool({
  name: "generateTest",
  description: "Generate a Playwright test from the recorded browser actions",
  parameters: z.object({
    sessionId: z
      .string()
      .optional()
      .describe(
        "ID of the session to generate code from (defaults to current session)"
      ),
    testName: z.string().optional().describe("Name for the generated test"),
    outputPath: z
      .string()
      .optional()
      .describe("Custom output path for this specific test"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;
    const sessionId = args.sessionId || toolContext.codegenSessionId;

    if (!sessionId) {
      return {
        error:
          "No active code generation session found. Start a session with startCodegenSession first.",
      };
    }

    const session = playwrightGenerator.getSession(sessionId);
    if (!session) {
      return {
        error: `Session with ID ${sessionId} not found.`,
      };
    }

    // End the session if it's still active
    if (!session.endTime) {
      playwrightGenerator.endSession(sessionId);
    }

    try {
      // Generate test code using the merged service
      const result = await playwrightGenerator.generateTest(sessionId);

      // Save the session for future reference
      await playwrightGenerator.saveSessionToDisk(sessionId);

      return {
        result: {
          testCode: result.testCode,
          filePath: result.filePath,
          sessionId: result.sessionId,
          message: `Test code generated and saved to ${result.filePath}`,
        },
      };
    } catch (error) {
      return {
        error: `Failed to generate test: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});

/**
 * Tool for ending a code generation session
 */
export const endCodegenSessionTool = createTool({
  name: "endCodegenSession",
  description: "End the current code generation session",
  parameters: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("ID of the session to end (defaults to current session)"),
    generateTest: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to generate a test when ending the session"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;
    const sessionId = args.sessionId || toolContext.codegenSessionId;

    if (!sessionId) {
      return {
        error: "No active code generation session found.",
      };
    }

    const session = playwrightGenerator.getSession(sessionId);
    if (!session) {
      return {
        error: `Session with ID ${sessionId} not found.`,
      };
    }

    // End the session
    playwrightGenerator.endSession(sessionId);

    // Generate test if requested
    if (args.generateTest) {
      try {
        const result = await playwrightGenerator.generateTest(sessionId);
        await playwrightGenerator.saveSessionToDisk(sessionId);

        return {
          result: {
            message: "Code generation session ended and test generated.",
            testCode: result.testCode,
            filePath: result.filePath,
          },
        };
      } catch (error) {
        return {
          error: `Session ended but failed to generate test: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }

    // Just end the session without generating test
    await playwrightGenerator.saveSessionToDisk(sessionId);

    // Clear the session ID from context
    delete toolContext.codegenSessionId;

    return {
      result: {
        message: "Code generation session ended.",
        sessionCount: session.actions.length,
      },
    };
  },
});

/**
 * Tool for recording browser actions in a session
 */
export const recordActionTool = createTool({
  name: "recordAction",
  description: "Record a browser action to the current code generation session",
  parameters: z.object({
    toolName: z.string().describe("Name of the tool/action being recorded"),
    parameters: z.record(z.unknown()).describe("Parameters of the action"),
    sessionId: z.string().optional().describe("ID of the session to record to"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;
    const sessionId = args.sessionId || toolContext.codegenSessionId;

    if (!sessionId) {
      return {
        error: "No active code generation session found.",
      };
    }

    const action = playwrightGenerator.addAction(
      sessionId,
      args.toolName,
      args.parameters
    );

    if (!action) {
      return {
        error: `Failed to record action: session with ID ${sessionId} not found.`,
      };
    }

    return {
      result: {
        message: `Action '${args.toolName}' recorded to session ${sessionId}`,
        actionCount:
          playwrightGenerator.getSession(sessionId)?.actions.length || 0,
      },
    };
  },
});

// Export all codegen tools for easy importing elsewhere
export const codegenTools = {
  startCodegenSessionTool,
  generateTestTool,
  endCodegenSessionTool,
  recordActionTool,
};
