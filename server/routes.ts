import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import multer from 'multer';

// Setup multer for file uploads
const storage_dir = path.join(os.tmpdir(), 'testgen_uploads');
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storage_dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: uploadStorage });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Simple API route to test if the server is working
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'TestGen API is running',
      apiKey: process.env.XAI_API_KEY ? 'API key is set' : 'No API key found'
    });
  });

  // Simple file upload endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Read file content
      const fileContent = await fs.promises.readFile(file.path, 'utf-8');
      
      // Calculate number of lines
      const lines = fileContent.split('\n').length;
      
      // Return simple analysis
      res.json({
        fileName: file.originalname,
        size: file.size,
        lines: lines,
        path: file.path
      });
    } catch (error) {
      console.error('Error analyzing file:', error);
      res.status(500).json({ 
        message: 'Error analyzing file', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return httpServer;
}
