import OpenAI from "openai";
import { FunctionInfo, Specification, TestTypes } from "../shared/schema";

export interface GrokConfig {
  apiKey: string;
  modelVersion: string;
  testFramework: string;
}

export class GrokApi {
  private openai: OpenAI;
  private model: string;
  private testFramework: string;

  constructor(config: GrokConfig) {
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: config.apiKey 
    });
    this.model = config.modelVersion === 'grok-3' ? 'grok-2-1212' : 'grok-2-1212'; // Adjust as needed when Grok 3 is available
    this.testFramework = config.testFramework;
  }

  async generateWhiteboxTests(
    func: FunctionInfo, 
    specification: Specification | null,
    coverageType: 'statement' | 'branch' | 'path'
  ): Promise<string> {
    // Construct the prompt for whitebox testing
    const coverageTypeMap = {
      'statement': 'Statement Coverage',
      'branch': 'Branch Coverage',
      'path': 'Path Coverage'
    };

    const prompt = `
You are a senior test engineer tasked with creating ${coverageTypeMap[coverageType]} tests for the following JavaScript function:

\`\`\`javascript
${func.code}
\`\`\`

${specification ? `This function has the following specification: "${specification.description}"` : ''}

Please generate comprehensive ${this.testFramework} test cases that achieve high ${coverageTypeMap[coverageType]}.
Tests should follow these criteria:
1. They should use ${this.testFramework} syntax and functions
2. They should include test cases that execute every ${coverageType === 'statement' ? 'statement' : coverageType === 'branch' ? 'branch' : 'execution path'} in the function
3. Tests should have clear, descriptive names
4. Include test cases for both valid and invalid inputs
5. Add comments explaining the purpose of each test case

Return ONLY the test code without any explanation outside the code block.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const testCode = response.choices[0].message.content?.trim() || '';
      return this.cleanupCode(testCode);
    } catch (error) {
      console.error('Error generating whitebox tests:', error);
      throw new Error(`Failed to generate ${coverageTypeMap[coverageType]} tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBlackboxTests(
    func: FunctionInfo,
    specification: Specification | null,
    testType: 'boundary' | 'equivalence'
  ): Promise<string> {
    if (!specification) {
      throw new Error('Specification required for blackbox testing');
    }

    const testTypeMap = {
      'boundary': 'Boundary Value Analysis',
      'equivalence': 'Equivalence Partitioning'
    };

    const prompt = `
You are a senior test engineer tasked with creating blackbox tests using ${testTypeMap[testType]} for the following JavaScript function:

Function name: ${func.name}
Parameters: ${func.params.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ')}
Return type: ${func.returnType || 'unknown'}

Specification: "${specification.description}"

Please generate comprehensive ${this.testFramework} test cases using ${testTypeMap[testType]} technique.
Tests should follow these criteria:
1. They should use ${this.testFramework} syntax and functions
2. For Boundary Value Analysis, focus on testing values at the boundaries of valid input ranges
3. For Equivalence Partitioning, identify groups of inputs that should behave the same way and test representatives from each group
4. Tests should have clear, descriptive names
5. Include both valid and invalid input test cases
6. Add comments explaining the purpose of each test case

Return ONLY the test code without any explanation outside the code block.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const testCode = response.choices[0].message.content?.trim() || '';
      return this.cleanupCode(testCode);
    } catch (error) {
      console.error('Error generating blackbox tests:', error);
      throw new Error(`Failed to generate ${testTypeMap[testType]} tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCICDFiles(testFramework: string): Promise<{ packageJson: string, githubWorkflow: string }> {
    const prompt = `
Generate two configuration files for a JavaScript project using ${testFramework} for testing:

1. A package.json file with:
   - Basic project information
   - Scripts for running tests and test coverage
   - Required dependencies for ${testFramework}

2. A GitHub Actions workflow file (.github/workflows/test.yml) that:
   - Runs on push to main branch and pull requests
   - Sets up Node.js
   - Installs dependencies
   - Runs tests

Return ONLY the content of these files without any explanation, separated by ---PACKAGE_JSON--- and ---WORKFLOW_YML--- markers.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content?.trim() || '';
      
      // Split the content based on markers
      const packageJsonMatch = content.match(/---PACKAGE_JSON---([\s\S]*?)(?:---WORKFLOW_YML---|$)/);
      const workflowMatch = content.match(/---WORKFLOW_YML---([\s\S]*)/);
      
      const packageJson = packageJsonMatch ? packageJsonMatch[1].trim() : '';
      const githubWorkflow = workflowMatch ? workflowMatch[1].trim() : '';

      return {
        packageJson: this.cleanupCode(packageJson),
        githubWorkflow: this.cleanupCode(githubWorkflow)
      };
    } catch (error) {
      console.error('Error generating CI/CD files:', error);
      throw new Error(`Failed to generate CI/CD files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanupCode(code: string): string {
    // Remove markdown code block markers if present
    let cleanCode = code.replace(/```(javascript|js|typescript|ts|yaml|yml|json)?/g, '').replace(/```$/g, '');
    
    // Trim any extra whitespace
    cleanCode = cleanCode.trim();
    
    return cleanCode;
  }
}
