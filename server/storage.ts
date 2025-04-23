import { 
  users,
  type User, 
  type InsertUser,
  type CodeFile,
  type InsertCodeFile,
  type Function as CodeFunction,
  type InsertFunction,
  type TestFile,
  type InsertTestFile,
  type Session,
  type InsertSession
} from "@shared/schema";

// Modify the interface with CRUD methods
export interface IStorage {
  // User methods (from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Code file methods
  createCodeFile(file: InsertCodeFile): Promise<CodeFile>;
  getCodeFileById(id: number): Promise<CodeFile | undefined>;
  getCodeFileByName(name: string): Promise<CodeFile | undefined>;
  getAllCodeFiles(): Promise<CodeFile[]>;
  
  // Function methods
  createFunction(fn: InsertFunction): Promise<CodeFunction>;
  getFunctionById(id: number): Promise<CodeFunction | undefined>;
  getFunctionsByFileId(fileId: number): Promise<CodeFunction[]>;
  getAllFunctions(): Promise<CodeFunction[]>;
  updateFunctionSpec(id: number, hasSpec: boolean): Promise<CodeFunction>;
  
  // Test file methods
  createTest(test: InsertTestFile): Promise<TestFile>;
  getTestById(id: number): Promise<TestFile | undefined>;
  getTestsByFunctionId(functionId: number): Promise<TestFile[]>;
  getAllTests(): Promise<TestFile[]>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session>;
  getSessionById(id: number): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  deleteSession(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private codeFiles: Map<number, CodeFile>;
  private functions: Map<number, CodeFunction>;
  private testFiles: Map<number, TestFile>;
  private sessions: Map<number, Session>;
  private userIdCounter: number;
  private codeFileIdCounter: number;
  private functionIdCounter: number;
  private testFileIdCounter: number;
  private sessionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.codeFiles = new Map();
    this.functions = new Map();
    this.testFiles = new Map();
    this.sessions = new Map();
    this.userIdCounter = 1;
    this.codeFileIdCounter = 1;
    this.functionIdCounter = 1;
    this.testFileIdCounter = 1;
    this.sessionIdCounter = 1;
  }

  // User methods (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Code file methods
  async createCodeFile(file: InsertCodeFile): Promise<CodeFile> {
    const id = this.codeFileIdCounter++;
    const codeFile: CodeFile = { ...file, id };
    this.codeFiles.set(id, codeFile);
    return codeFile;
  }
  
  async getCodeFileById(id: number): Promise<CodeFile | undefined> {
    return this.codeFiles.get(id);
  }
  
  async getCodeFileByName(name: string): Promise<CodeFile | undefined> {
    return Array.from(this.codeFiles.values()).find(file => file.name === name);
  }
  
  async getAllCodeFiles(): Promise<CodeFile[]> {
    return Array.from(this.codeFiles.values());
  }
  
  // Function methods
  async createFunction(fn: InsertFunction): Promise<CodeFunction> {
    const id = this.functionIdCounter++;
    const codeFunction: CodeFunction = { ...fn, id };
    this.functions.set(id, codeFunction);
    return codeFunction;
  }
  
  async getFunctionById(id: number): Promise<CodeFunction | undefined> {
    return this.functions.get(id);
  }
  
  async getFunctionsByFileId(fileId: number): Promise<CodeFunction[]> {
    return Array.from(this.functions.values()).filter(fn => fn.fileId === fileId);
  }
  
  async getAllFunctions(): Promise<CodeFunction[]> {
    return Array.from(this.functions.values());
  }
  
  async updateFunctionSpec(id: number, hasSpec: boolean): Promise<CodeFunction> {
    const fn = await this.getFunctionById(id);
    if (!fn) {
      throw new Error(`Function with id ${id} not found`);
    }
    
    const updated: CodeFunction = { ...fn, hasSpec };
    this.functions.set(id, updated);
    return updated;
  }
  
  // Test file methods
  async createTest(test: InsertTestFile): Promise<TestFile> {
    const id = this.testFileIdCounter++;
    const testFile: TestFile = { ...test, id };
    this.testFiles.set(id, testFile);
    return testFile;
  }
  
  async getTestById(id: number): Promise<TestFile | undefined> {
    return this.testFiles.get(id);
  }
  
  async getTestsByFunctionId(functionId: number): Promise<TestFile[]> {
    return Array.from(this.testFiles.values()).filter(test => test.functionId === functionId);
  }
  
  async getAllTests(): Promise<TestFile[]> {
    return Array.from(this.testFiles.values());
  }
  
  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const newSession: Session = {
      ...session,
      id,
      created_at: now,
      updated_at: now
    };
    this.sessions.set(id, newSession);
    return newSession;
  }
  
  async updateSession(id: number, sessionUpdate: Partial<InsertSession>): Promise<Session> {
    const session = await this.getSessionById(id);
    if (!session) {
      throw new Error(`Session with id ${id} not found`);
    }
    
    const updatedSession: Session = {
      ...session,
      ...sessionUpdate,
      id,
      updated_at: new Date()
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getSessionById(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }
  
  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }
  
  async deleteSession(id: number): Promise<boolean> {
    const exists = this.sessions.has(id);
    if (exists) {
      this.sessions.delete(id);
    }
    return exists;
  }
}

export const storage = new MemStorage();
