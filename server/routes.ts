import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeCode } from "./services/codeAnalyzer";
import { generateTests, getTestGenerationStatus } from "./services/testGenerator";
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
  
  // Session management endpoints
  
  // Create a new session
  app.post('/api/sessions', async (req, res) => {
    try {
      const { name, description, files, extractedFunctions, generatedTests, stats } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Session name is required" });
      }
      
      const session = await storage.createSession({
        name,
        description,
        files: files || [],
        extractedFunctions,
        generatedTests,
        stats
      });
      
      return res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create session" 
      });
    }
  });
  
  // Get all sessions
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      return res.json(sessions);
    } catch (error) {
      console.error('Error getting sessions:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get sessions" 
      });
    }
  });
  
  // Get a session by ID
  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const session = await storage.getSessionById(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      return res.json(session);
    } catch (error) {
      console.error('Error getting session:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get session" 
      });
    }
  });
  
  // Update a session
  app.put('/api/sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const { name, description, files, extractedFunctions, generatedTests, stats } = req.body;
      
      const session = await storage.updateSession(id, {
        name,
        description,
        files,
        extractedFunctions,
        generatedTests,
        stats
      });
      
      return res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update session" 
      });
    }
  });
  
  // Delete a session
  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const deleted = await storage.deleteSession(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete session" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
