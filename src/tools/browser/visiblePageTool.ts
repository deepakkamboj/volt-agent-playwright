/**
 * @file Browser Visible Page Tools
 * @description Tools for working with visible elements on the page
 */

import { z } from "zod";
import { createTool } from "@voltagent/core";
import { ToolContext } from "../common/types";
import { safeBrowserOperation } from "./browserBaseTools";

/**
 * Tool for getting all visible text on a page
 */
export const getVisibleTextTool = createTool({
  name: "getVisibleText",
  description: "Extract all visible text from the current page",
  parameters: z.object({
    excludeSelectors: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Array of selectors to exclude from text extraction"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      const visibleText = await page.evaluate((excludeSelectors) => {
        // Helper to get all text nodes from an element
        function getTextNodes(element: Element): string[] {
          if (!element) return [];

          // Check if element is hidden via CSS
          const style = window.getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          ) {
            return [];
          }

          // Check if element should be excluded
          for (const selector of excludeSelectors) {
            if (element.matches(selector)) {
              return [];
            }
          }

          // Get text from this element, excluding child elements
          let text = "";
          for (const node of Array.from(element.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              text += (node.textContent || "").trim() + " ";
            }
          }

          // Include text from children recursively
          const childResults: string[] = [];
          for (const child of Array.from(element.children)) {
            childResults.push(...getTextNodes(child));
          }

          return [text, ...childResults].filter((t) => t.trim().length > 0);
        }

        // Start from the body element
        return getTextNodes(document.body).join("\n");
      }, args.excludeSelectors);

      return {
        result: `Extracted ${visibleText.length} characters of visible text`,
        text: visibleText,
      };
    });
  },
});

/**
 * Tool for getting the visible HTML content of the current page
 */
export const getVisibleHtmlTool = createTool({
  name: "getVisibleHtml",
  description: "Get the HTML content of the current page",
  parameters: z.object({
    selector: z
      .string()
      .optional()
      .describe("Optional CSS selector to get HTML for a specific element"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      try {
        let htmlContent;

        if (args.selector) {
          // Get HTML for specific element
          await page.waitForSelector(args.selector);
          htmlContent = await page.$eval(args.selector, (el) => el.outerHTML);
        } else {
          // Get HTML for entire page
          htmlContent = await page.content();
        }

        return {
          result: `Retrieved HTML content${
            args.selector ? ` for selector: ${args.selector}` : ""
          }`,
          html: htmlContent,
        };
      } catch (error) {
        throw new Error(
          `Failed to get HTML content: ${(error as Error).message}`
        );
      }
    });
  },
});

/**
 * Tool for listing visible interactive elements
 */
export const listInteractiveElementsTool = createTool({
  name: "listInteractiveElements",
  description:
    "List all visible interactive elements (links, buttons, inputs) on the page",
  parameters: z.object({
    includeDisabled: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include disabled elements in the results"),
    maxResults: z
      .number()
      .positive()
      .optional()
      .default(100)
      .describe("Maximum number of elements to return"),
  }),
  execute: async (args, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      const elements = await page.evaluate(
        (options) => {
          const { includeDisabled, maxResults } = options;

          // Get all interactive elements
          const interactiveSelectors = [
            "a",
            "button",
            "input",
            "select",
            "textarea",
            '[role="button"]',
            '[role="link"]',
            '[role="checkbox"]',
            '[role="radio"]',
            '[role="tab"]',
            '[role="menuitem"]',
          ];

          const allElements = Array.from(
            document.querySelectorAll(interactiveSelectors.join(","))
          );

          // Filter for visibility and enabled state
          const visibleElements = allElements.filter((el) => {
            // Check if visible
            const style = window.getComputedStyle(el);
            const isVisible =
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              el.getBoundingClientRect().height > 0 &&
              el.getBoundingClientRect().width > 0;

            // Check if enabled
            const isDisabled =
              el.hasAttribute("disabled") ||
              el.getAttribute("aria-disabled") === "true";

            return isVisible && (includeDisabled || !isDisabled);
          });

          // Limit results
          const limitedElements = visibleElements.slice(0, maxResults);

          // Format results
          return limitedElements.map((el) => {
            const tagName = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const classes = Array.from(el.classList)
              .map((c) => `.${c}`)
              .join("");
            const text = (el.textContent || "").trim().substring(0, 50);
            const selector = id || classes || tagName;

            return {
              type: tagName,
              text: text,
              selector: selector,
              location: {
                x: el.getBoundingClientRect().left,
                y: el.getBoundingClientRect().top,
                width: el.getBoundingClientRect().width,
                height: el.getBoundingClientRect().height,
              },
            };
          });
        },
        { includeDisabled: args.includeDisabled, maxResults: args.maxResults }
      );

      return {
        result: `Found ${elements.length} interactive elements on the page`,
        elements: elements,
      };
    });
  },
});

/**
 * Export all visible page tools as a group
 */
export const visiblePageTools = {
  getVisibleTextTool,
  getVisibleHtmlTool,
  listInteractiveElementsTool,
};
