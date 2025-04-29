/**
 * @file Browser User Agent Tools
 * @description Tools for managing browser user agent settings
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { ensureBrowser } from "./playwrightToolHandler";

// Common user agent strings
const COMMON_USER_AGENTS = {
  chrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  safari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  tablet:
    "Mozilla/5.0 (iPad; CPU OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  bot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

/**
 * Tool for setting browser user agent
 */
export const setUserAgentTool = createTool({
  name: "setUserAgent",
  description: "Set the browser's user agent string",
  parameters: z.object({
    userAgent: z.string().describe("User agent string to set"),
    preset: z
      .enum(Object.keys(COMMON_USER_AGENTS) as [string, ...string[]])
      .optional()
      .describe("Optional preset user agent (overrides userAgent if provided)"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    try {
      // Need to reset context for user agent change
      const { browser } = await ensureBrowser(toolContext);

      // Determine user agent to use
      const userAgent = args.preset
        ? COMMON_USER_AGENTS[args.preset as keyof typeof COMMON_USER_AGENTS]
        : args.userAgent;

      // Create a new context with the user agent
      const newContext = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 720 },
      });

      // Create a new page in the context
      const newPage = await newContext.newPage();

      // Update context references
      toolContext.browserContext = newContext;
      toolContext.page = newPage;

      return {
        result: `Set user agent to: ${userAgent}`,
        userAgent,
      };
    } catch (error) {
      throw new Error(`Failed to set user agent: ${(error as Error).message}`);
    }
  },
});

/**
 * Tool for getting current user agent
 */
export const getUserAgentTool = createTool({
  name: "getUserAgent",
  description: "Get the browser's current user agent string",
  parameters: z.object({}),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    try {
      const { page } = await ensureBrowser(toolContext);

      // Evaluate userAgent in browser
      const userAgent = await page.evaluate(() => navigator.userAgent);

      return {
        result: `Current user agent is: ${userAgent}`,
        userAgent,
      };
    } catch (error) {
      throw new Error(`Failed to get user agent: ${(error as Error).message}`);
    }
  },
});

/**
 * Export all user agent tools as a group
 */
export const userAgentTools = {
  setUserAgentTool,
  getUserAgentTool,
};
