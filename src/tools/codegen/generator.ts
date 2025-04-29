import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  CodegenAction,
  CodegenOptions,
  CodegenResult,
  CodegenSession,
  PlaywrightTestCase,
} from "./types";

/**
 * Manages Playwright test code generation and recording sessions from VoltAgent actions
 */
export class PlaywrightGenerator {
  private static readonly DEFAULT_OPTIONS: Required<CodegenOptions> = {
    outputPath: "tests",
    testNamePrefix: "VoltTest",
    includeComments: true,
  };

  // Default directory for storing sessions
  private static readonly DEFAULT_SESSIONS_DIR = "sessions";

  private options: Required<CodegenOptions>;

  // In-memory store for active sessions
  private static activeSessions: Map<string, CodegenSession> = new Map();

  constructor(options: CodegenOptions = {}) {
    this.validateOptions(options);
    this.options = { ...PlaywrightGenerator.DEFAULT_OPTIONS, ...options };
  }

  private validateOptions(options: CodegenOptions): void {
    if (options.outputPath && typeof options.outputPath !== "string") {
      throw new Error("outputPath must be a string");
    }
    if (options.testNamePrefix && typeof options.testNamePrefix !== "string") {
      throw new Error("testNamePrefix must be a string");
    }
    if (
      options.includeComments !== undefined &&
      typeof options.includeComments !== "boolean"
    ) {
      throw new Error("includeComments must be a boolean");
    }
  }

  /**
   * Create a new code generation session
   */
  createSession(options?: CodegenOptions): CodegenSession {
    const session: CodegenSession = {
      id: uuidv4(),
      actions: [],
      startTime: Date.now(),
      options: { ...this.options, ...options },
    };

    PlaywrightGenerator.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Add an action to an existing session
   */
  addAction(
    sessionId: string,
    toolName: string,
    parameters: Record<string, unknown>,
    result?: unknown
  ): CodegenAction | null {
    const session = PlaywrightGenerator.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    const action: CodegenAction = {
      toolName,
      parameters,
      timestamp: Date.now(),
      result,
    };

    session.actions.push(action);
    return action;
  }

  /**
   * End a code generation session
   */
  endSession(sessionId: string): CodegenSession | null {
    const session = PlaywrightGenerator.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    session.endTime = Date.now();
    return session;
  }

  /**
   * Get active session by ID
   */
  getSession(sessionId: string): CodegenSession | undefined {
    return PlaywrightGenerator.activeSessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): CodegenSession[] {
    return Array.from(PlaywrightGenerator.activeSessions.values());
  }

  /**
   * Remove a session from memory
   */
  removeSession(sessionId: string): boolean {
    return PlaywrightGenerator.activeSessions.delete(sessionId);
  }

  /**
   * Generate Playwright test code from a session
   */
  async generateTest(sessionId: string): Promise<CodegenResult> {
    const session = PlaywrightGenerator.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    if (!Array.isArray(session.actions)) {
      throw new Error("Invalid session data");
    }

    const testCase = this.createTestCase(session);
    const testCode = this.generateTestCode(testCase);
    const filePath = this.getOutputFilePath(session);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write test code to file
    await fs.writeFile(filePath, testCode);

    return {
      testCode,
      filePath,
      sessionId: session.id,
    };
  }

  /**
   * Save session to disk for later reference
   */
  async saveSessionToDisk(
    sessionId: string,
    directory?: string
  ): Promise<string> {
    const session = PlaywrightGenerator.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    const outputDir =
      directory ||
      path.join(
        this.options.outputPath,
        PlaywrightGenerator.DEFAULT_SESSIONS_DIR
      );
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, `session-${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));

    return filePath;
  }

  /**
   * Load a session from disk
   */
  async loadSessionFromDisk(
    sessionId: string,
    directory?: string
  ): Promise<CodegenSession> {
    const outputDir =
      directory ||
      path.join(
        this.options.outputPath,
        PlaywrightGenerator.DEFAULT_SESSIONS_DIR
      );
    const filePath = path.join(outputDir, `session-${sessionId}.json`);

    try {
      const sessionData = await fs.readFile(filePath, "utf-8");
      const session = JSON.parse(sessionData) as CodegenSession;

      // Store the session in memory for immediate use
      PlaywrightGenerator.activeSessions.set(session.id, session);

      return session;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load session ${sessionId}: ${error.message}`
        );
      } else {
        throw new Error(`Failed to load session ${sessionId}: Unknown error`);
      }
    }
  }

  /**
   * List all saved sessions from disk
   */
  async listSavedSessions(directory?: string): Promise<string[]> {
    const outputDir =
      directory ||
      path.join(
        this.options.outputPath,
        PlaywrightGenerator.DEFAULT_SESSIONS_DIR
      );

    try {
      await fs.mkdir(outputDir, { recursive: true });
      const files = await fs.readdir(outputDir);

      // Filter for session files and extract session IDs
      return files
        .filter((file) => file.startsWith("session-") && file.endsWith(".json"))
        .map((file) => file.replace("session-", "").replace(".json", ""));
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to list saved sessions: ${error.message}`);
      } else {
        console.error("Failed to list saved sessions: Unknown error");
      }
      return [];
    }
  }

  /**
   * Import session from a file
   */
  async importSession(filePath: string): Promise<CodegenSession> {
    try {
      const sessionData = await fs.readFile(filePath, "utf-8");
      let session = JSON.parse(sessionData) as CodegenSession;

      // If the imported session doesn't have an ID, generate one
      if (!session.id) {
        session = {
          ...session,
          id: uuidv4(),
        };
      }

      // Store in memory
      PlaywrightGenerator.activeSessions.set(session.id, session);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import session: ${error.message}`);
      } else {
        throw new Error("Failed to import session: Unknown error");
      }
    }
  }

  private createTestCase(session: CodegenSession): PlaywrightTestCase {
    const testCase: PlaywrightTestCase = {
      name: `${this.options.testNamePrefix}_${
        new Date(session.startTime).toISOString().split("T")[0]
      }`,
      steps: [],
      imports: new Set(["test", "expect"]),
    };

    for (const action of session.actions) {
      const step = this.convertActionToStep(action);
      if (step) {
        testCase.steps.push(step);
      }
    }

    return testCase;
  }

  private convertActionToStep(action: CodegenAction): string | null {
    const { toolName, parameters } = action;

    switch (toolName) {
      // Navigation tools
      case "playwright_navigate":
      case "navigate":
        return this.generateNavigateStep(parameters);
      case "goBack":
        return this.generateGoBackStep(parameters);
      case "goForward":
        return this.generateGoForwardStep(parameters);
      case "refreshPage":
        return this.generateRefreshPageStep(parameters);
      case "closeBrowser":
        return this.generateCloseBrowserStep();

      // Form and interaction tools
      case "playwright_fill":
      case "type":
        return this.generateFillStep(parameters);
      case "playwright_click":
      case "click":
        return this.generateClickStep(parameters);
      case "getTextTool":
        return this.generateGetTextStep(parameters);
      case "playwright_select":
      case "selectOption":
        return this.generateSelectStep(parameters);
      case "check":
        return this.generateCheckStep(parameters);
      case "uncheck":
        return this.generateUncheckStep(parameters);
      case "playwright_hover":
      case "hover":
        return this.generateHoverStep(parameters);
      case "pressKey":
        return this.generatePressKeyStep(parameters);
      case "waitForElement":
        return this.generateWaitForElementStep(parameters);

      // Screenshot and export tools
      case "playwright_screenshot":
      case "screenshot":
        return this.generateScreenshotStep(parameters);
      case "saveToFile":
        return this.generateSaveToFileStep(parameters);
      case "exportPdf":
        return this.generateExportPdfStep(parameters);
      case "extractData":
        return this.generateExtractDataStep(parameters);

      // Assertion and expectation tools
      case "playwright_expect_response":
      case "expectResponse":
        return this.generateExpectResponseStep(parameters);
      case "playwright_assert_response":
      case "assertResponse":
        return this.generateAssertResponseStep(parameters);

      // User agent tools
      case "playwright_custom_user_agent":
      case "setUserAgent":
        return this.generateCustomUserAgentStep(parameters);
      case "getUserAgent":
        return this.generateGetUserAgentStep();

      // Visibility and DOM tools
      case "getVisibleText":
        return this.generateGetVisibleTextStep(parameters);
      case "getVisibleHtml":
        return this.generateGetVisibleHtmlStep(parameters);
      case "listInteractiveElements":
        return this.generateListInteractiveElementsStep();

      default:
        console.warn(`Unsupported tool: ${toolName}`);
        return null;
    }
  }

  private generateNavigateStep(parameters: Record<string, unknown>): string {
    const url = parameters.url ? `\`${parameters.url}\`` : '""';
    return `await page.goto(${url});`;
  }

  private generateGoBackStep(parameters: Record<string, unknown>): string {
    return `await page.goBack();`;
  }

  private generateGoForwardStep(parameters: Record<string, unknown>): string {
    return `await page.goForward();`;
  }

  private generateRefreshPageStep(parameters: Record<string, unknown>): string {
    return `await page.reload();`;
  }

  private generateCloseBrowserStep(): string {
    return `await browser.close();`;
  }

  private generateFillStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    const text = parameters.text ? `\`${parameters.text}\`` : '""';
    return `await page.fill(${selector}, ${text});`;
  }

  private generateClickStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `await page.click(${selector});`;
  }

  private generateGetTextStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `const text = await page.textContent(${selector});`;
  }

  private generateSelectStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    const value = parameters.value ? `\`${parameters.value}\`` : '""';
    return `await page.selectOption(${selector}, ${value});`;
  }

  private generateCheckStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `await page.check(${selector});`;
  }

  private generateUncheckStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `await page.uncheck(${selector});`;
  }

  private generateHoverStep(parameters: Record<string, unknown>): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `await page.hover(${selector});`;
  }

  private generatePressKeyStep(parameters: Record<string, unknown>): string {
    const key = parameters.key ? `\`${parameters.key}\`` : '""';
    return `await page.press(${key});`;
  }

  private generateWaitForElementStep(
    parameters: Record<string, unknown>
  ): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `await page.waitForSelector(${selector});`;
  }

  private generateScreenshotStep(parameters: Record<string, unknown>): string {
    const path = parameters.path ? `\`${parameters.path}\`` : '""';
    return `await page.screenshot({ path: ${path} });`;
  }

  private generateSaveToFileStep(parameters: Record<string, unknown>): string {
    const data = parameters.data ? `\`${parameters.data}\`` : '""';
    const filePath = parameters.filePath ? `\`${parameters.filePath}\`` : '""';
    return `await fs.writeFile(${filePath}, ${data});`;
  }

  private generateExportPdfStep(parameters: Record<string, unknown>): string {
    const path = parameters.path ? `\`${parameters.path}\`` : '""';
    return `await page.pdf({ path: ${path} });`;
  }

  private generateExtractDataStep(parameters: Record<string, unknown>): string {
    // Implementation for data extraction
    return `// Extract data logic here`;
  }

  private generateExpectResponseStep(
    parameters: Record<string, unknown>
  ): string {
    const url = parameters.url ? `\`${parameters.url}\`` : '""';
    return `await page.waitForResponse(response => response.url() === ${url});`;
  }

  private generateAssertResponseStep(
    parameters: Record<string, unknown>
  ): string {
    const url = parameters.url ? `\`${parameters.url}\`` : '""';
    return `const response = await page.waitForResponse(${url});`;
  }

  private generateCustomUserAgentStep(
    parameters: Record<string, unknown>
  ): string {
    const userAgent = parameters.userAgent
      ? `\`${parameters.userAgent}\``
      : '""';
    return `await context.setUserAgent(${userAgent});`;
  }

  private generateGetUserAgentStep(): string {
    return `const userAgent = await context.userAgent();`;
  }

  private generateGetVisibleTextStep(
    parameters: Record<string, unknown>
  ): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `const visibleText = await page.locator(${selector}).textContent();`;
  }

  private generateGetVisibleHtmlStep(
    parameters: Record<string, unknown>
  ): string {
    const selector = parameters.selector ? `\`${parameters.selector}\`` : '""';
    return `const visibleHtml = await page.locator(${selector}).innerHTML();`;
  }

  private generateListInteractiveElementsStep(): string {
    return `const elements = await page.$$('a, button, [tabindex], [contenteditable]);`;
  }

  private generateTestCode(testCase: PlaywrightTestCase): string {
    const imports = Array.from(testCase.imports)
      .map((imp) => `import { ${imp} } from '@playwright/test';`)
      .join("\n");

    return `

${imports}

test('${testCase.name}', async ({ page, context }) => {
  ${testCase.steps.join("\n")}
});`;
  }

  private getOutputFilePath(session: CodegenSession): string {
    if (!session.id) {
      throw new Error("Session ID is required");
    }

    const sanitizedPrefix = this.options.testNamePrefix
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    const fileName = `${sanitizedPrefix}_${session.id}.spec.ts`;
    return path.resolve(this.options.outputPath, fileName);
  }
}

// Export a singleton instance with default options
export const playwrightGenerator = new PlaywrightGenerator();
