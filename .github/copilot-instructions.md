- Ensure that all application files are located only in the `src` folder.
- Use concise comments to represent unchanged code when modifying existing files.
- Group changes by file, and include a clear summary of modifications for each file.
- Always start code blocks with a comment containing the filepath.
- Avoid repeating existing code unnecessarily; focus only on the changes required.
- When creating new files, ensure they are placed within the `src` folder.
- Remove unwanted files to keep the project clean and organized.
- Avoid creating duplicate files when adding new code or features.

- We are developing a multi-agent application that generates and runs Playwright tests from plain English instructions
- Create agents using the createTool function from "@voltagent/core" with Zod schemas for validation
- For tools in the src/tools/browser folder, ensure they launch browser windows using the Playwright code defined in the ensureBrowser() function
- Use common types from src\tools\common\types.ts

- Code in src/tools/browser has been imported from another GitHub repository. Please refactor it to work with Playwright and VoltAgent libraries.
