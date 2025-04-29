/**
 * @file Browser Output Tools
 * @description Tools for saving and outputting data from the browser
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";
import * as fs from "fs";
import * as path from "path";

/**
 * Tool for saving content to a file
 */
export const saveToFileTool = createTool({
  name: "saveToFile",
  description: "Save content to a file",
  parameters: z.object({
    content: z.string().describe("Content to save to the file"),
    filePath: z.string().describe("Path where the file should be saved"),
    overwrite: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to overwrite existing file"),
  }),
  execute: async (args, context) => {
    try {
      // Create directory if it doesn't exist
      const dirPath = path.dirname(args.filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Check if file exists when overwrite is false
      if (!args.overwrite && fs.existsSync(args.filePath)) {
        throw new Error(
          `File already exists: ${args.filePath}. Set overwrite to true to replace it.`
        );
      }

      // Write content to file
      fs.writeFileSync(args.filePath, args.content);

      return {
        result: `Content saved to file: ${args.filePath}`,
        filePath: args.filePath,
      };
    } catch (error) {
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  },
});

/**
 * Tool for exporting page as PDF
 */
export const exportPdfTool = createTool({
  name: "exportPdf",
  description: "Export the current page as a PDF file",
  parameters: z.object({
    filePath: z.string().describe("Path where the PDF should be saved"),
    landscape: z
      .boolean()
      .optional()
      .default(false)
      .describe("Use landscape page orientation"),
    printBackground: z
      .boolean()
      .optional()
      .default(true)
      .describe("Print background graphics"),
    format: z
      .string()
      .optional()
      .default("A4")
      .describe("Paper format (A4, Letter, etc.)"),
    margin: z
      .object({
        top: z.string().optional().default("0.4in"),
        right: z.string().optional().default("0.4in"),
        bottom: z.string().optional().default("0.4in"),
        left: z.string().optional().default("0.4in"),
      })
      .optional()
      .default({})
      .describe("Page margins"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      // Create directory if it doesn't exist
      const dirPath = path.dirname(args.filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      await page.pdf({
        path: args.filePath,
        landscape: args.landscape,
        printBackground: args.printBackground,
        format: args.format as any,
        margin: args.margin,
      });

      return {
        result: `Page exported as PDF to: ${args.filePath}`,
        filePath: args.filePath,
      };
    });
  },
});

/**
 * Tool for extracting structured data from the page
 */
export const extractDataTool = createTool({
  name: "extractData",
  description: "Extract structured data from the page using CSS selectors",
  parameters: z.object({
    selectors: z
      .record(z.string())
      .describe("Map of data keys to CSS selectors"),
    includeHtml: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include HTML content for each selector"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      const extractedData = await page.evaluate(
        (params) => {
          const { selectors, includeHtml } = params;
          const result: Record<string, { text: string; html?: string }> = {};

          for (const [key, selector] of Object.entries(selectors)) {
            const element = document.querySelector(selector);
            if (element) {
              result[key] = {
                text: (element.textContent || "").trim(),
              };

              if (includeHtml) {
                result[key].html = element.innerHTML;
              }
            } else {
              result[key] = { text: "" };
            }
          }

          return result;
        },
        { selectors: args.selectors, includeHtml: args.includeHtml }
      );

      return {
        result: `Extracted data for ${
          Object.keys(args.selectors).length
        } selectors`,
        data: extractedData,
      };
    });
  },
});

/**
 * Export all output tools as a group
 */
export const outputTools = {
  saveToFileTool,
  exportPdfTool,
  extractDataTool,
};
