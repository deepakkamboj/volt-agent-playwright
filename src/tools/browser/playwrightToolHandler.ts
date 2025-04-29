/**
 * @file Playwright Browser Management
 * @description Handles browser lifecycle management, initialization, and cleanup
 *
 * This module provides core browser functionality for VoltAgent Playwright tools:
 * - Maintains global browser state (browser, context, page)
 * - Ensures browser is available when needed with ensureBrowser()
 * - Provides clean browser state reset with resetBrowserState()
 * - Supports different browser types (chromium, firefox, webkit)
 * - Preserves browser state between tool invocations when possible
 */

import {
  chromium,
  firefox,
  webkit,
  Browser,
  BrowserContext,
  Page,
} from "playwright";
import { ToolContext } from "../common/types";

// Flag to track if browser is initializing to prevent concurrent initialization
let isInitializing = false;

/**
 * Ensures a browser instance is available and returns it along with an active page
 */
export async function ensureBrowser(
  context: ToolContext
): Promise<{ browser: Browser; page: Page }> {
  // Prevent concurrent initialization
  if (isInitializing) {
    console.log("Browser initialization in progress, waiting...");
    // Wait until initialization is complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Check if browser is already initialized
  if (!context.browser || !context.browser.isConnected()) {
    try {
      isInitializing = true;
      console.log("Launching new browser instance...");

      // Launch a new browser - using chromium by default
      context.browser = await chromium.launch({
        headless: false, // Set to true for production use
        slowMo: 40, // Slow down operations for better visibility during testing
      });

      // Create a new context and page
      const browserContext = await context.browser.newContext({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
      });
      context.page = await browserContext.newPage();
      console.log("Browser launched successfully");
    } catch (error) {
      console.error("Failed to initialize browser:", error);
      throw error;
    } finally {
      isInitializing = false;
    }
  } else if (!context.page || context.page.isClosed()) {
    // Create a new page if needed
    context.page = await context.browser.newPage();
    console.log("Created new page in existing browser");
  }

  return { browser: context.browser, page: context.page };
}

/**
 * Function to reset browser state
 */
export function resetBrowserState(context?: ToolContext): void {
  if (context) {
    context.browser = undefined;
    context.page = undefined;
  }
  console.log("Browser state reset");
}
