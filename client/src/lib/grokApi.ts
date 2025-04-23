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

export async function downloadAutomationFile(
  type: 'package_json' | 'shell_script' | 'github_actions' | 'dockerfile', 
  projectName?: string,
  nodeVersion?: string
): Promise<Blob> {
  let url = `/api/automation-file?type=${type}`;
  
  if (projectName) {
    url += `&projectName=${encodeURIComponent(projectName)}`;
  }
  
  if (nodeVersion) {
    url += `&nodeVersion=${encodeURIComponent(nodeVersion)}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
  
  return response.blob();
}
