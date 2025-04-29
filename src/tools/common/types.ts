import { Browser, Page } from "playwright";

export interface ToolContext {
  // Browser tools related properties
  browser?: Browser;
  page?: Page;

  // Code generation properties
  codegenSessionId?: string;

  // Add any other context properties needed for tools
  [key: string]: any;
}
