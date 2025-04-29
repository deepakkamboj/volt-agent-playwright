# voltAgentApp

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![VoltAgent](https://img.shields.io/badge/VoltAgent-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Mistral AI](https://img.shields.io/badge/Mistral_AI-5A67D8?style=for-the-badge&logoColor=white)

A multi-agent [VoltAgent](https://github.com/vercel/voltagent) application for browser automation and test generation.

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm, yarn, or pnpm
- Playwright browsers (installed automatically)

### Installation

1. Clone this repository
2. Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
```

3. Install Playwright browsers

```bash
npx playwright install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Example Prompts

Here are some example prompts you can use to interact with the agents:

#### Browser Automation

```
Go to google.com, search for "Playwright automation", and take a screenshot of the results.
```

```
Visit github.com, navigate to the Playwright repository, and extract the number of stars it has.
```

```
Go to a login page, fill in the username "testuser" and password "password123", then click the login button.
```

#### Test Generation

```
Start recording a test session, navigate to example.com, click on the first link, wait for the page to load, verify the page title contains "Example", and then generate a test script.
```

```
Create a test that checks if the login form on myapp.com validates email addresses correctly.
```

```
Generate a test script that verifies all navigation links on wikipedia.org work correctly.
```

#### Multi-Step Workflows

```
Go to an e-commerce site, add three items to the cart, proceed to checkout, and generate a test script for this entire workflow.
```

```
Create a monitoring test that checks if our company website responds within 2 seconds and doesn't have any console errors.
```

```
Visit my web application, create a new account, verify email confirmation works, then generate a regression test for this user registration flow.
```

## Features

This project uses VoltAgent as a framework for building AI agents with the following capabilities:

- **Multi-Agent Architecture** - Specialized agents working together to solve complex tasks
- **Browser Automation** - Interact with websites programmatically using Playwright
- **Test Generation** - Create Playwright test scripts from browser sessions
- **Natural Language Interface** - Control browser and generate tests using plain English commands
- **Tool Integration** - Extensible system with specialized tools for various tasks

## Agents

### Browser Agent

The Browser Agent specializes in web automation tasks. It can navigate websites, interact with page elements, capture screenshots, and extract data from web pages.

### Code Generation Agent

The Code Generation Agent creates automated Playwright test scripts from recorded browser sessions. It can record browser actions and generate executable test code.

## Multi-Agent Capabilities

The application leverages a supervisor-agent architecture where the main agent can delegate tasks to specialized sub-agents:

- **Task Delegation** - The main agent determines which specialized agent should handle a task
- **Context Sharing** - Agents can share context and results with each other
- **Collaborative Problem Solving** - Complex tasks are broken down and solved by multiple agents working together

## Tools

### Browser Navigation Tools

| Tool             | Description                         |
| ---------------- | ----------------------------------- |
| navigationTool   | Navigate to a URL                   |
| goBackTool       | Navigate back in browser history    |
| goForwardTool    | Navigate forward in browser history |
| refreshPageTool  | Refresh the current page            |
| closeBrowserTool | Close the browser                   |

### Browser Interaction Tools

| Tool               | Description                      |
| ------------------ | -------------------------------- |
| clickTool          | Click on an element              |
| typeTool           | Type text into an input field    |
| getTextTool        | Get text content from an element |
| selectOptionTool   | Select an option from a dropdown |
| checkTool          | Check a checkbox or radio button |
| uncheckTool        | Uncheck a checkbox               |
| hoverTool          | Hover over an element            |
| pressKeyTool       | Press a keyboard key             |
| waitForElementTool | Wait for an element to appear    |

### Data and Export Tools

| Tool            | Description                |
| --------------- | -------------------------- |
| saveToFileTool  | Save content to a file     |
| exportPdfTool   | Export page as PDF         |
| extractDataTool | Extract data from the page |
| screenshotTool  | Take a screenshot          |

### Testing and Validation Tools

| Tool               | Description                     |
| ------------------ | ------------------------------- |
| expectResponseTool | Expect a specific response      |
| assertResponseTool | Assert properties of a response |

### User Agent Tools

| Tool             | Description                |
| ---------------- | -------------------------- |
| setUserAgentTool | Set a custom user agent    |
| getUserAgentTool | Get the current user agent |

### Visibility and DOM Tools

| Tool                        | Description                    |
| --------------------------- | ------------------------------ |
| getVisibleTextTool          | Get visible text from the page |
| getVisibleHtmlTool          | Get visible HTML from the page |
| listInteractiveElementsTool | List all interactive elements  |

### Code Generation Tools

| Tool                    | Description                           |
| ----------------------- | ------------------------------------- |
| startCodegenSessionTool | Start recording a session             |
| recordActionTool        | Record a browser action               |
| generateTestTool        | Generate a test from recorded actions |
| endCodegenSessionTool   | End a recording session               |

## Technology Stack

- **VoltAgent** - Framework for building and running AI agents
- **Playwright** - Browser automation library for reliable end-to-end testing
- **TypeScript** - Type-safe JavaScript for better development experience
- **Mistral AI** - Large language model for natural language processing
- **Vercel AI SDK** - Integration with AI models

## Project Structure

```
.
├── src/
│   ├── agents/              # Agent definitions
│   │   ├── browserAgent.ts  # Browser automation agent
│   │   └── codegenAgent.ts  # Test generation agent
│   ├── tools/               # Tool implementations
│   │   ├── browser/         # Browser automation tools
│   │   └── codegen/         # Code generation tools
│   └── index.ts             # Main application entry point
├── .voltagent/              # Auto-generated folder for agent memory
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
