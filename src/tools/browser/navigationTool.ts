/**
 * @file Browser Navigation Tools
 * @description VoltAgent tools for browser navigation operations
 *
 * This module provides tools for:
 * - URL navigation (navigate)
 * - Browser history navigation (back, forward)
 * - Page refreshing
 * - Browser closing
 *
 * Each tool is created using VoltAgent's createTool() function with:
 * - Zod validation schemas for parameters
 * - Safe browser operation handling
 * - Consistent error reporting
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { resetBrowserState } from "./playwrightToolHandler";
import { safeBrowserOperation } from "./browserBaseTools";

/**
 * Tool for navigating to URLs
 */
const navigationTool = createTool({
  name: "navigate",
  description: "Navigate to a URL in the browser",
  parameters: z.object({
    url: z
      .string()
      .url({ message: "Please provide a valid URL" })
      .describe("The URL to navigate to"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .default("load")
      .describe("Navigation wait condition"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.goto(args.url, {
        timeout: args.timeout,
        waitUntil: args.waitUntil,
      });

      return { result: `Navigated to ${args.url}` };
    });
  },
});

/**
 * Tool for navigating back in browser history
 */
const goBackTool = createTool({
  name: "goBack",
  description: "Navigate back in browser history",
  parameters: z.object({
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
      await page.goBack({ timeout: args.timeout });
      return { result: "Navigated back in browser history" };
    });
  },
});

/**
 * Tool for navigating forward in browser history
 */
const goForwardTool = createTool({
  name: "goForward",
  description: "Navigate forward in browser history",
  parameters: z.object({
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
      await page.goForward({ timeout: args.timeout });
      return { result: "Navigated forward in browser history" };
    });
  },
});

/**
 * Tool for refreshing the current page
 */
const refreshPageTool = createTool({
  name: "refreshPage",
  description: "Refresh the current page",
  parameters: z.object({
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
      await page.reload({ timeout: args.timeout });
      return { result: "Page refreshed successfully" };
    });
  },
});

/**
 * Tool for closing the browser
 */
const closeBrowserTool = createTool({
  name: "closeBrowser",
  description: "Close the current browser instance",
  parameters: z.object({}),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    if (toolContext.browser) {
      try {
        if (toolContext.browser.isConnected()) {
          await toolContext.browser.close().catch((error) => {
            console.error("Error while closing browser:", error);
          });
        } else {
          console.error("Browser already disconnected, cleaning up state");
        }
      } catch (error) {
        console.error("Error during browser close operation:", error);
      } finally {
        resetBrowserState();
      }
      return { result: "Browser closed successfully" };
    }
    return { result: "No browser instance to close" };
  },
});

// Export all navigation tools
export {
  navigationTool,
  goBackTool,
  goForwardTool,
  refreshPageTool,
  closeBrowserTool,
};
