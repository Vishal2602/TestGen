import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const sessionId = url.pathname.split('/').pop() || '';

      if (sessionId) {
        console.log(`WebSocket connected: ${sessionId}`);
        this.connections.set(sessionId, ws);

        ws.on('message', (message) => {
          this.handleMessage(sessionId, message.toString());
        });

        ws.on('close', () => {
          console.log(`WebSocket disconnected: ${sessionId}`);
          this.connections.delete(sessionId);
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for ${sessionId}:`, error);
        });

        // Send welcome message
        this.sendMessage(sessionId, {
          type: 'connection',
          message: 'Connected to TestGen WebSocket server'
        });
      } else {
        ws.close(1008, 'Session ID required');
      }
    });
  }

  private handleMessage(sessionId: string, messageData: string) {
    try {
      const message = JSON.parse(messageData) as WebSocketMessage;
      
      // Process messages from clients if needed
      console.log(`Received message from ${sessionId}:`, message);
      
      // Add message handling logic here if needed
    } catch (error) {
      console.error(`Error parsing message from ${sessionId}:`, error);
    }
  }

  public sendMessage(sessionId: string, message: WebSocketMessage) {
    const ws = this.connections.get(sessionId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    
    return false;
  }

  public broadcastMessage(message: WebSocketMessage) {
    let count = 0;
    
    this.connections.forEach((ws, sessionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        count++;
      }
    });
    
    return count;
  }

  public getConnection(sessionId: string): WebSocket | undefined {
    return this.connections.get(sessionId);
  }

  public getActiveConnections(): number {
    return this.connections.size;
  }
}
