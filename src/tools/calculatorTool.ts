import { createTool } from "@voltagent/core";
import { z } from "zod";

export const calculatorTool = createTool({
  name: "calculate",
  description: "Perform a mathematical calculation",
  parameters: z.object({
    expression: z.string().describe("The mathematical expression to evaluate"),
  }),
  execute: async (args) => {
    try {
      // args is automatically typed as { expression: string }
      const result = eval(args.expression);
      return { result };
    } catch (error) {
      throw new Error(`Invalid expression: ${args.expression}`);
    }
  },
});
