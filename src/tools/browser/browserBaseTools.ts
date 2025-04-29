/**
 * @file Browser Base Tools
 * @description Common utilities and base functionality for browser-based tools
 *
 * This module provides:
 * - Base schema definitions for browser tools
 * - Safe execution wrapper for browser operations
 * - Helper functions for common browser tasks
 * - Error handling for browser operations
 *
 * All browser-specific tools should use the utilities from this module
 * to ensure consistent behavior and error handling.
 */

import { Browser, Page } from "playwright";
import { ToolContext } from "../common/types";
import { ensureBrowser, resetBrowserState } from "./playwrightToolHandler";

/**
 * Safe browser operation function to handle errors consistently across all browser tools
 * This wraps operations with proper error handling and browser initialization
 */
export async function safeBrowserOperation<T>(
  context: ToolContext,
  operation: (page: Page) => Promise<T>
): Promise<T> {
  try {
    // Use the ensureBrowser function from playwrightToolHandler.ts
    const { page } = await ensureBrowser(context);
    return await operation(page);
  } catch (error) {
    console.error("Browser operation failed:", error);
    throw error;
  }
}

/**
 * Export the resetBrowserState function to make it available to other tools
 */
export { resetBrowserState };
