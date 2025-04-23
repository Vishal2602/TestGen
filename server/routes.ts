import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeCode } from "./services/codeAnalyzer";
import { generateTests, getTestGenerationStatus } from "./services/testGenerator";
import { generateAutomationFile } from "./services/automationGenerator";
import { AutomationType } from "@shared/schema";
import archiver from "archiver";

export async function registerRoutes(app: Express): Promise<Server> {
  // Code analysis endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { files } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided for analysis" });
      }
      
      // Analyze the code files
      const result = await analyzeCode(files);
      
      return res.json(result);
    } catch (error) {
      console.error('Error analyzing code:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze code" 
      });
    }
  });

  // Test generation endpoint
  app.post('/api/generate-tests', async (req, res) => {
    try {
      const { files } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files provided for test generation" });
      }
      
      // Start test generation in the background
      const result = await generateTests(files);
      
      return res.json(result);
    } catch (error) {
      console.error('Error generating tests:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate tests" 
      });
    }
  });

  // Test generation status endpoint
  app.get('/api/test-status', async (req, res) => {
    try {
      const status = await getTestGenerationStatus();
      return res.json(status);
    } catch (error) {
      console.error('Error getting test status:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get test status" 
      });
    }
  });

  // Download test package endpoint
  app.get('/api/download-tests', async (req, res) => {
    try {
      // Get all generated tests
      const tests = await storage.getAllTests();
      
      if (!tests || tests.length === 0) {
        return res.status(404).json({ message: "No tests available for download" });
      }
      
      // Create a zip file with all test files
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=test-package.zip');
      
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      archive.pipe(res);
      
      // Add test files to the archive
      for (const test of tests) {
        archive.append(test.testCode, { name: test.testFileName });
      }
      
      // Add package.json with Jest configuration
      const packageJson = {
        "name": "generated-tests",
        "version": "1.0.0",
        "description": "Generated tests using TestGen",
        "scripts": {
          "test": "jest"
        },
        "jest": {
          "testEnvironment": "node"
        },
        "devDependencies": {
          "jest": "^29.5.0"
        }
      };
      
      archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });
      
      // Add README with instructions
      const readme = `# Generated Tests

This package contains automatically generated tests using TestGen, an LLM-powered testing tool.

## Running the tests

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Run the tests:
   \`\`\`
   npm test
   \`\`\`

## Test files

${tests.map(test => `- ${test.testFileName}`).join('\n')}
`;
      
      archive.append(readme, { name: 'README.md' });
      
      // Finalize the archive
      await archive.finalize();
      
    } catch (error) {
      console.error('Error downloading tests:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to download tests" 
      });
    }
  });
  
  // Generate automation file endpoint
  app.get('/api/automation-file', async (req, res) => {
    try {
      // Get the type of automation file to generate
      const type = req.query.type as AutomationType;
      const projectName = req.query.projectName as string || 'test-runner';
      const nodeVersion = req.query.nodeVersion as string || '18';
      
      if (!type || !['package_json', 'shell_script', 'github_actions', 'dockerfile'].includes(type)) {
        return res.status(400).json({ message: "Invalid automation file type" });
      }
      
      // Get all generated tests
      const tests = await storage.getAllTests();
      
      if (!tests || tests.length === 0) {
        return res.status(404).json({ message: "No tests available" });
      }
      
      // Generate the automation file
      const automationFile = generateAutomationFile({
        tests,
        type,
        projectName,
        nodeVersion
      });
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', automationFile.type);
      res.setHeader('Content-Disposition', `attachment; filename=${automationFile.filename}`);
      
      // Send the file content
      res.send(automationFile.content);
      
    } catch (error) {
      console.error('Error generating automation file:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate automation file" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
