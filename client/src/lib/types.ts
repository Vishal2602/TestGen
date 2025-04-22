import { FunctionInfo, Specification, TestFile, TestTypes, CICDFile, FunctionTest } from "@shared/schema";

export type AppStep = 1 | 2 | 3 | 4;

export interface AppState {
  currentStep: AppStep;
  jsFiles: File[];
  specFile: File | null;
  functions: FunctionInfo[];
  specifications: Specification[];
  testTypes: TestTypes;
  apiKey: string;
  modelVersion: string;
  testFramework: string;
  functionTests: FunctionTest[];
  testFiles: TestFile[];
  cicdFiles: CICDFile[];
  apiLogs: string[];
  isGenerating: boolean;
  generationComplete: boolean;
}

export interface FileWithPreview extends File {
  preview?: string;
}

export type ApiKeyProviderProps = {
  children: React.ReactNode;
};

export type ApiKeyContextType = {
  apiKey: string;
  setApiKey: (key: string) => void;
};

export interface UploadedJsFile {
  file: File;
  fileName: string;
  size: string;
}

export interface FilePreview {
  name: string;
  size: string;
  content: string;
}
