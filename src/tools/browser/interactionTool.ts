/**
 * @file Browser Interaction Tools
 * @description VoltAgent tools for interacting with page elements
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";

/**
 * Tool for clicking on an element
 */
export const clickTool = createTool({
  name: "click",
  description: "Click on an element on the page",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    button: z
      .enum(["left", "right", "middle"])
      .optional()
      .default("left")
      .describe("Mouse button to use"),
    clickCount: z
      .number()
      .positive()
      .optional()
      .default(1)
      .describe("Number of clicks"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.click(args.selector, {
        button: args.button,
        clickCount: args.clickCount,
        force: args.force,
        timeout: args.timeout,
      });

      return { result: `Clicked on element with selector: ${args.selector}` };
    });
  },
});

/**
 * Tool for typing text into an input field
 */
export const typeTool = createTool({
  name: "type",
  description: "Type text into an input field",
  parameters: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the input element"),
    text: z.string().describe("Text to type"),
    delay: z
      .number()
      .optional()
      .default(0)
      .describe("Delay between keystrokes in milliseconds"),
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
      await page.fill(args.selector, args.text, { timeout: args.timeout });

      return {
        result: `Typed "${args.text}" into element with selector: ${args.selector}`,
      };
    });
  },
});

/**
 * Tool for extracting text content from an element
 */
export const getTextTool = createTool({
  name: "getText",
  description: "Get text content from an element",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
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
      const text = await page.$eval(
        args.selector,
        (el) => el.textContent?.trim() || ""
      );

      return {
        result: `Text content: ${text}`,
        text,
      };
    });
  },
});

/**
 * Tool for selecting options from dropdown or select elements
 */
export const selectOptionTool = createTool({
  name: "selectOption",
  description: "Select one or more options from a dropdown or select element",
  parameters: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the select element"),
    values: z
      .union([
        z.string().array().describe("Array of values to select"),
        z.string().describe("Single value to select"),
      ])
      .describe("Option value(s) to select"),
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
      // Convert single value to array if needed
      const values =
        typeof args.values === "string" ? [args.values] : args.values;

      await page.selectOption(args.selector, values, { timeout: args.timeout });
      return {
        result: `Selected option(s): ${
          Array.isArray(values) ? values.join(", ") : values
        } in dropdown with selector: ${args.selector}`,
      };
    });
  },
});

/**
 * Tool for checking a checkbox or radio button
 */
export const checkTool = createTool({
  name: "check",
  description: "Check a checkbox or radio button",
  parameters: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the checkbox or radio"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.check(args.selector, {
        timeout: args.timeout,
        force: args.force,
      });
      return { result: `Checked element with selector: ${args.selector}` };
    });
  },
});

/**
 * Tool for unchecking a checkbox
 */
export const uncheckTool = createTool({
  name: "uncheck",
  description: "Uncheck a checkbox",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the checkbox"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.uncheck(args.selector, {
        timeout: args.timeout,
        force: args.force,
      });
      return { result: `Unchecked element with selector: ${args.selector}` };
    });
  },
});

/**
 * Tool for hovering over an element
 */
export const hoverTool = createTool({
  name: "hover",
  description: "Hover over an element",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.hover(args.selector, {
        timeout: args.timeout,
        force: args.force,
      });
      return { result: `Hovered over element with selector: ${args.selector}` };
    });
  },
});

/**
 * Tool for pressing a keyboard key
 */
export const pressKeyTool = createTool({
  name: "pressKey",
  description: "Press a keyboard key or key combination",
  parameters: z.object({
    key: z
      .string()
      .describe("Key or key combination to press (e.g., 'Enter', 'Control+A')"),
    selector: z
      .string()
      .optional()
      .describe("Optional selector to focus before pressing key"),
    delay: z
      .number()
      .optional()
      .default(0)
      .describe("Delay between keystrokes in milliseconds"),
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
      // Focus element if selector provided
      if (args.selector) {
        await page.focus(args.selector, { timeout: args.timeout });
      }

      await page.keyboard.press(args.key, { delay: args.delay });
      return {
        result: args.selector
          ? `Pressed ${args.key} on element with selector: ${args.selector}`
          : `Pressed ${args.key}`,
      };
    });
  },
});

/**
 * Tool for waiting for an element to appear or become visible
 */
export const waitForElementTool = createTool({
  name: "waitForElement",
  description: "Wait for an element to appear or become visible",
  parameters: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    state: z
      .enum(["attached", "detached", "visible", "hidden"])
      .optional()
      .default("visible")
      .describe("Element state to wait for"),
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
      await page.waitForSelector(args.selector, {
        state: args.state,
        timeout: args.timeout,
      });
      return {
        result: `Element with selector: ${args.selector} is now in state: ${args.state}`,
      };
    });
  },
});

/**
 * Export all interaction tools as a group
 */
export const interactionTools = {
  clickTool,
  typeTool,
  getTextTool,
  selectOptionTool,
  checkTool,
  uncheckTool,
  hoverTool,
  pressKeyTool,
  waitForElementTool,
};
