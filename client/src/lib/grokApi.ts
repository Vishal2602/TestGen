import { apiRequest } from './queryClient';
import { 
  AnalysisResponse, 
  GenerateTestsResponse, 
  UploadedFile,
  TestGenerationStatus 
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
