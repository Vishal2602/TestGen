import { GrokApi, GrokConfig } from './grokApi';
import { FunctionInfo, Specification, TestTypes, TestFile, CICDFile, FunctionTest, TestCategory, TestStatus, TestResult } from '../shared/schema';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocket } from 'ws';

export class TestGenerator {
  private grokApi: GrokApi;
  private ws: WebSocket | null = null;
  private abortController: AbortController = new AbortController();

  constructor(config: GrokConfig) {
    this.grokApi = new GrokApi(config);
  }

  setWebSocket(ws: WebSocket) {
    this.ws = ws;
  }

  sendUpdate(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  log(message: string) {
    console.log(message);
    this.sendUpdate({ type: 'log', message });
  }

  updateFunctionStatus(functionName: string, status: TestStatus) {
    this.sendUpdate({ 
      type: 'function_status', 
      functionName, 
      status 
    });
  }

  updateTestResult(functionName: string, category: TestCategory, status: TestStatus, count: number = 0) {
    this.sendUpdate({ 
      type: 'test_result', 
      functionName, 
      category, 
      status, 
      count 
    });
  }

  async generateTests(
    functions: FunctionInfo[],
    specifications: Specification[],
    testTypes: TestTypes
  ): Promise<{testFiles: TestFile[], cicdFiles: CICDFile[]}> {
    this.log(`[INFO] Starting test generation for ${functions.length} functions`);
    
    const testFiles: TestFile[] = [];
    const functionTests: FunctionTest[] = this.prepareFunctionTests(functions, testTypes);
    
    // Process each function
    for (const func of functions) {
      if (this.abortController.signal.aborted) {
        this.log(`[INFO] Test generation aborted`);
        break;
      }

      try {
        this.log(`[INFO] Processing function: ${func.name}`);
        this.updateFunctionStatus(func.name, 'in_progress');
        
        // Find matching specification
        const matchingSpec = specifications.find(spec => spec.mappedFunction === func.name) || null;
        
        // Generate test file content
        const testFileContent = await this.generateTestFileContent(
          func,
          matchingSpec,
          testTypes
        );
        
        const fileName = `${func.name}.test.js`;
        
        // Count tests
        const testCount = (testFileContent.match(/\btest\(/g) || []).length;
        
        // Get all active test categories
        const categories: TestCategory[] = [];
        if (testTypes.whitebox.statement) categories.push('whitebox_statement');
        if (testTypes.whitebox.branch) categories.push('whitebox_branch');
        if (testTypes.whitebox.path) categories.push('whitebox_path');
        if (testTypes.blackbox.boundary) categories.push('blackbox_boundary');
        if (testTypes.blackbox.equivalence) categories.push('blackbox_equivalence');
        
        testFiles.push({
          name: fileName,
          content: testFileContent,
          functionName: func.name,
          testCount,
          categories: categories.filter(c => testFileContent.includes(getCategoryComment(c)))
        });
        
        this.updateFunctionStatus(func.name, 'completed');
        this.log(`[INFO] Completed tests for ${func.name} with ${testCount} test cases`);
      } catch (error) {
        this.updateFunctionStatus(func.name, 'failed');
        this.log(`[ERROR] Failed to generate tests for ${func.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Generate CI/CD files
    this.log(`[INFO] Generating CI/CD configuration files`);
    const cicdFiles = await this.generateCICDFiles();
    
    return { testFiles, cicdFiles };
  }

  async generateTestFileContent(
    func: FunctionInfo,
    specification: Specification | null,
    testTypes: TestTypes
  ): Promise<string> {
    let testContent = '';
    
    // Generate test file header
    testContent += this.generateTestHeader(func);
    
    // Generate whitebox tests
    if (testTypes.whitebox.statement) {
      this.updateTestResult(func.name, 'whitebox_statement', 'in_progress');
      this.log(`[INFO] Generating statement coverage tests for ${func.name}`);
      try {
        const statementTests = await this.grokApi.generateWhiteboxTests(func, specification, 'statement');
        const count = (statementTests.match(/\btest\(/g) || []).length;
        testContent += `\n// ${getCategoryComment('whitebox_statement')}\n${statementTests}\n`;
        this.updateTestResult(func.name, 'whitebox_statement', 'completed', count);
      } catch (error) {
        this.updateTestResult(func.name, 'whitebox_statement', 'failed');
        this.log(`[ERROR] Failed to generate statement coverage tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (testTypes.whitebox.branch) {
      this.updateTestResult(func.name, 'whitebox_branch', 'in_progress');
      this.log(`[INFO] Generating branch coverage tests for ${func.name}`);
      try {
        const branchTests = await this.grokApi.generateWhiteboxTests(func, specification, 'branch');
        const count = (branchTests.match(/\btest\(/g) || []).length;
        testContent += `\n// ${getCategoryComment('whitebox_branch')}\n${branchTests}\n`;
        this.updateTestResult(func.name, 'whitebox_branch', 'completed', count);
      } catch (error) {
        this.updateTestResult(func.name, 'whitebox_branch', 'failed');
        this.log(`[ERROR] Failed to generate branch coverage tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (testTypes.whitebox.path) {
      this.updateTestResult(func.name, 'whitebox_path', 'in_progress');
      this.log(`[INFO] Generating path coverage tests for ${func.name}`);
      try {
        const pathTests = await this.grokApi.generateWhiteboxTests(func, specification, 'path');
        const count = (pathTests.match(/\btest\(/g) || []).length;
        testContent += `\n// ${getCategoryComment('whitebox_path')}\n${pathTests}\n`;
        this.updateTestResult(func.name, 'whitebox_path', 'completed', count);
      } catch (error) {
        this.updateTestResult(func.name, 'whitebox_path', 'failed');
        this.log(`[ERROR] Failed to generate path coverage tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Generate blackbox tests (only if specification is available)
    if (specification) {
      if (testTypes.blackbox.boundary) {
        this.updateTestResult(func.name, 'blackbox_boundary', 'in_progress');
        this.log(`[INFO] Generating boundary value analysis tests for ${func.name}`);
        try {
          const boundaryTests = await this.grokApi.generateBlackboxTests(func, specification, 'boundary');
          const count = (boundaryTests.match(/\btest\(/g) || []).length;
          testContent += `\n// ${getCategoryComment('blackbox_boundary')}\n${boundaryTests}\n`;
          this.updateTestResult(func.name, 'blackbox_boundary', 'completed', count);
        } catch (error) {
          this.updateTestResult(func.name, 'blackbox_boundary', 'failed');
          this.log(`[ERROR] Failed to generate boundary value tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      if (testTypes.blackbox.equivalence) {
        this.updateTestResult(func.name, 'blackbox_equivalence', 'in_progress');
        this.log(`[INFO] Generating equivalence partitioning tests for ${func.name}`);
        try {
          const equivalenceTests = await this.grokApi.generateBlackboxTests(func, specification, 'equivalence');
          const count = (equivalenceTests.match(/\btest\(/g) || []).length;
          testContent += `\n// ${getCategoryComment('blackbox_equivalence')}\n${equivalenceTests}\n`;
          this.updateTestResult(func.name, 'blackbox_equivalence', 'completed', count);
        } catch (error) {
          this.updateTestResult(func.name, 'blackbox_equivalence', 'failed');
          this.log(`[ERROR] Failed to generate equivalence partitioning tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else {
      this.log(`[INFO] No specification found for ${func.name}, skipping blackbox tests`);
    }
    
    // Generate footer
    testContent += `\n});`;
    
    return testContent;
  }

  generateTestHeader(func: FunctionInfo): string {
    const relativePath = './' + path.basename(func.fileName, path.extname(func.fileName));
    
    return `
const { ${func.name} } = require('${relativePath}');

describe('${func.name} function', () => {
`;
  }

  async generateCICDFiles(): Promise<CICDFile[]> {
    try {
      const { packageJson, githubWorkflow } = await this.grokApi.generateCICDFiles(this.grokApi.testFramework);
      
      return [
        {
          name: 'package.json',
          content: packageJson,
          fileType: 'package_json'
        },
        {
          name: '.github/workflows/test.yml',
          content: githubWorkflow,
          fileType: 'github_workflow'
        }
      ];
    } catch (error) {
      this.log(`[ERROR] Failed to generate CI/CD files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  prepareFunctionTests(functions: FunctionInfo[], testTypes: TestTypes): FunctionTest[] {
    return functions.map(func => {
      const results: TestResult[] = [];
      
      if (testTypes.whitebox.statement) {
        results.push({ category: 'whitebox_statement', status: 'pending', count: 0 });
      }
      
      if (testTypes.whitebox.branch) {
        results.push({ category: 'whitebox_branch', status: 'pending', count: 0 });
      }
      
      if (testTypes.whitebox.path) {
        results.push({ category: 'whitebox_path', status: 'pending', count: 0 });
      }
      
      if (testTypes.blackbox.boundary) {
        results.push({ category: 'blackbox_boundary', status: 'pending', count: 0 });
      }
      
      if (testTypes.blackbox.equivalence) {
        results.push({ category: 'blackbox_equivalence', status: 'pending', count: 0 });
      }
      
      return {
        functionName: func.name,
        fileName: func.fileName,
        status: 'pending',
        results
      };
    });
  }

  abort() {
    this.abortController.abort();
  }
}

function getCategoryComment(category: TestCategory): string {
  const categoryMap: Record<TestCategory, string> = {
    'whitebox_statement': 'WHITEBOX TESTS - STATEMENT COVERAGE',
    'whitebox_branch': 'WHITEBOX TESTS - BRANCH COVERAGE',
    'whitebox_path': 'WHITEBOX TESTS - PATH COVERAGE',
    'blackbox_boundary': 'BLACKBOX TESTS - BOUNDARY VALUE ANALYSIS',
    'blackbox_equivalence': 'BLACKBOX TESTS - EQUIVALENCE PARTITIONING'
  };
  
  return categoryMap[category];
}
