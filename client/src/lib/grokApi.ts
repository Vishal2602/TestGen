import { apiRequest } from './queryClient';
import { 
  AnalysisResponse, 
  GenerateTestsResponse, 
  UploadedFile,
  TestGenerationStatus,
  Session,
  ExtractedFunction,
  GeneratedTest
} from './types';

export async function analyzeCode(files: UploadedFile[]): Promise<AnalysisResponse> {
  const response = await apiRequest('POST', '/api/analyze', { files });
  return response.json();
}

export async function generateTests(files: UploadedFile[]): Promise<GenerateTestsResponse> {
  const response = await apiRequest('POST', '/api/generate-tests', { files });
  return response.json();
}

export async function getTestGenerationStatus(): Promise<TestGenerationStatus> {
  const response = await apiRequest('GET', '/api/test-status');
  return response.json();
}

export async function downloadTestPackage(): Promise<Blob> {
  const response = await fetch('/api/download-tests', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
  
  return response.blob();
}

// Session API functions
export async function saveSession(
  name: string, 
  description: string | undefined, 
  files: UploadedFile[], 
  extractedFunctions?: ExtractedFunction[],
  generatedTests?: GeneratedTest[],
  stats?: {
    totalFiles: number;
    totalFunctions: number;
    totalTests: number;
    averageCoverage?: number;
  }
): Promise<Session> {
  const response = await apiRequest('POST', '/api/sessions', {
    name,
    description,
    files,
    extractedFunctions,
    generatedTests,
    stats
  });
  return response.json();
}

export async function getAllSessions(): Promise<Session[]> {
  const response = await apiRequest('GET', '/api/sessions');
  return response.json();
}

export async function getSessionById(id: number): Promise<Session> {
  const response = await apiRequest('GET', `/api/sessions/${id}`);
  return response.json();
}

export async function updateSession(
  id: number,
  sessionData: Partial<Omit<Session, 'id' | 'created_at' | 'updated_at'>>
): Promise<Session> {
  const response = await apiRequest('PUT', `/api/sessions/${id}`, sessionData);
  return response.json();
}

export async function deleteSession(id: number): Promise<{ success: boolean }> {
  const response = await apiRequest('DELETE', `/api/sessions/${id}`);
  return response.json();
}
