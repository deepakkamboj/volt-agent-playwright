/**
 * @file Browser Console Tools
 * @description VoltAgent tools for interacting with browser console and executing JavaScript
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";

/**
 * Tool for executing JavaScript in the browser
 */
export const evaluateJsTool = createTool({
  name: "evaluateJs",
  description: "Execute JavaScript code in the browser and return the result",
  parameters: z.object({
    expression: z.string().describe("JavaScript expression or code to execute"),
    argObj: z
      .record(z.any())
      .optional()
      .describe("Optional arguments to pass to the function"),
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
      const result = await page.evaluate(args.expression, args.argObj || {});

      return {
        result: "JavaScript execution completed",
        returnValue: result,
      };
    });
  },
});

/**
 * Tool for listening to console messages
 */
export const listenToConsoleTool = createTool({
  name: "listenToConsole",
  description: "Start capturing browser console messages",
  parameters: z.object({
    duration: z
      .number()
      .positive()
      .optional()
      .default(10000)
      .describe("Duration to listen for messages in milliseconds"),
    types: z
      .array(z.enum(["log", "debug", "info", "error", "warning", "assert"]))
      .optional()
      .default(["log", "info", "error", "warning"])
      .describe("Types of console messages to capture"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      const messages: Array<{ type: string; text: string; time: string }> = [];

      // Set up console listener
      page.on("console", (msg) => {
        const type = msg.type();
        if (args.types.includes(type as any)) {
          messages.push({
            type: type,
            text: msg.text(),
            time: new Date().toISOString(),
          });
        }
      });

      // Wait for specified duration
      await page.waitForTimeout(args.duration);

      return {
        result: `Captured ${messages.length} console messages`,
        messages,
      };
    });
  },
});

/**
 * Tool for evaluating a selector and getting an element's properties
 */
export const getElementPropertiesTool = createTool({
  name: "getElementProperties",
  description: "Get properties of an element on the page",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    properties: z.array(z.string()).describe("List of properties to retrieve"),
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
      await page.waitForSelector(args.selector, { timeout: args.timeout });

      const properties = await page.$eval(
        args.selector,
        (element, props) => {
          const result: Record<string, any> = {};
          props.forEach((prop: string) => {
            result[prop] = (element as any)[prop];
          });
          return result;
        },
        args.properties
      );

      return {
        result: `Retrieved ${
          Object.keys(properties).length
        } properties for element with selector: ${args.selector}`,
        properties,
      };
    });
  },
});

/**
 * Tool for getting HTML content
 */
export const getHtmlTool = createTool({
  name: "getHtml",
  description: "Get HTML content from the page or a specific element",
  parameters: z.object({
    selector: z
      .string()
      .optional()
      .describe("Optional CSS or XPath selector for a specific element"),
    includeOuterHTML: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include outer HTML of the element"),
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
      let html = "";

      if (args.selector) {
        await page.waitForSelector(args.selector, { timeout: args.timeout });
        html = await page.$eval(
          args.selector,
          (el, includeOuter) => {
            return includeOuter ? el.outerHTML : el.innerHTML;
          },
          args.includeOuterHTML
        );
      } else {
        html = await page.content();
      }

      return {
        result: args.selector
          ? `Retrieved HTML from element with selector: ${args.selector}`
          : "Retrieved full page HTML",
        html,
      };
    });
  },
});

/**
 * Export all console tools as a group
 */
export const consoleTools = {
  evaluateJsTool,
  listenToConsoleTool,
  getElementPropertiesTool,
  getHtmlTool,
};
