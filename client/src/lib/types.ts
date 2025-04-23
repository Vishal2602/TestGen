// File types
export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  size: number;
  type: 'js' | 'ts' | 'jsx' | 'tsx' | 'md' | 'unknown';
  isSpecFile: boolean;
  functionCount?: number;
}

// Code analysis types
export interface ExtractedFunction {
  id: string;
  name: string;
  code: string;
  params: string[];
  returnType?: string;
  file: string;
  hasSpec: boolean;
}

// Test generation types
export interface TestGenerationStatus {
  total: number;
  completed: number;
  inProgress: string | null;
  apiCalls: number;
  estimatedTimeRemaining: string;
}

export interface CoverageMetrics {
  statementCoverage: number;
  branchCoverage: number;
  pathCoverage: number;
  boundaryValuesCovered: number;
  edgeCasesCovered: number;
}

export interface GeneratedTest {
  id: string;
  functionName: string;
  fileName: string;
  testFileName: string;
  testCode: string;
  testCount: number;
  types: string[];
  coverage?: CoverageMetrics;
}

// API response types
export interface AnalysisResponse {
  functions: ExtractedFunction[];
  specMatching: {
    matchedCount: number;
    totalFunctions: number;
  };
}

export interface GenerateTestsResponse {
  tests: GeneratedTest[];
  status: TestGenerationStatus;
}

export enum ProcessingStage {
  NotStarted = 'NOT_STARTED',
  Analyzing = 'ANALYZING',
  Matching = 'MATCHING',
  Generating = 'GENERATING',
  Completed = 'COMPLETED',
  Failed = 'FAILED'
}

// Session types
export interface Session {
  id: number;
  name: string;
  description?: string;
  files: UploadedFile[];
  extractedFunctions?: ExtractedFunction[];
  generatedTests?: GeneratedTest[];
  stats?: {
    totalFiles: number;
    totalFunctions: number;
    totalTests: number;
    averageCoverage?: number;
  };
  created_at: string | Date;
  updated_at: string | Date;
}
