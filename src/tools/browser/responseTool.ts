/**
 * @file Browser Response Tools
 * @description Tools for handling and asserting network responses
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";
import type { Response } from "playwright";

// Store response promises by ID
const responsePromises = new Map<string, Promise<Response>>();

/**
 * Tool for setting up response wait operations
 */
export const expectResponseTool = createTool({
  name: "expectResponse",
  description: "Start waiting for a network response matching a URL pattern",
  parameters: z.object({
    id: z
      .string()
      .describe("Unique identifier for this response wait operation"),
    url: z.string().describe("URL or regex pattern to match for the response"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      const responsePromise = page.waitForResponse(args.url, {
        timeout: args.timeout,
      });

      responsePromises.set(args.id, responsePromise);

      return { result: `Started waiting for response with ID ${args.id}` };
    });
  },
});

/**
 * Tool for asserting and validating responses
 */
export const assertResponseTool = createTool({
  name: "assertResponse",
  description:
    "Assert and validate a previously initiated response wait operation",
  parameters: z.object({
    id: z.string().describe("ID of the response wait operation to check"),
    value: z
      .string()
      .optional()
      .describe("Optional value to check for in the response body"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async () => {
      const responsePromise = responsePromises.get(args.id);
      if (!responsePromise) {
        throw new Error(`No response wait operation found with ID: ${args.id}`);
      }

      try {
        const response = await responsePromise;
        const body = await response.json().catch(() => null);

        if (args.value && body) {
          const bodyStr = JSON.stringify(body);
          if (!bodyStr.includes(args.value)) {
            throw new Error(
              `Response body does not contain expected value: ${args.value}\nActual body: ${bodyStr}`
            );
          }
        }

        const result = {
          url: response.url(),
          status: response.status(),
          body: body,
        };

        return {
          result: `Response assertion for ID ${args.id} successful`,
          response: result,
        };
      } finally {
        responsePromises.delete(args.id);
      }
    });
  },
});

/**
 * Export all response tools as a group
 */
export const responseTools = {
  expectResponseTool,
  assertResponseTool,
};
