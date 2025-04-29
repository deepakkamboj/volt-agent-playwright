/**
 * @file Browser Screenshot Tools
 * @description VoltAgent tools for capturing screenshots in browser
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";
import path from "path";
import fs from "fs";

/**
 * Tool for capturing a screenshot of the current page
 */
export const screenshotTool = createTool({
  name: "screenshot",
  description: "Capture a screenshot of the current page",
  parameters: z.object({
    fullPage: z
      .boolean()
      .optional()
      .default(true)
      .describe("Capture the full page or just the viewport"),
    path: z
      .string()
      .optional()
      .describe("Optional path to save the screenshot"),
    quality: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .default(80)
      .describe("JPEG quality (0-100)"),
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
      const screenshotOptions = {
        fullPage: args.fullPage,
        quality: args.quality,
        timeout: args.timeout,
      };

      // If path is provided, ensure directory exists
      if (args.path) {
        const dir = path.dirname(args.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        await page.screenshot({
          ...screenshotOptions,
          path: args.path,
        });

        return {
          result: `Screenshot saved to ${args.path}`,
          filePath: args.path,
        };
      }

      // Otherwise return base64 data
      const buffer = await page.screenshot(screenshotOptions);
      const base64Data = buffer.toString("base64");

      return {
        result: "Screenshot captured successfully",
        data: `data:image/jpeg;base64,${base64Data}`,
      };
    });
  },
});

/**
 * Export all screenshot tools as a group
 */
export const screenshotTools = {
  screenshotTool,
};
