import { storage } from '../storage';
import { generateTestCases } from './grokService';
import { GenerateTestsResponse, TestGenerationStatus, UploadedFile } from '@/lib/types';

// Global state for tracking progress
let testGenerationState: TestGenerationStatus = {
  total: 0,
  completed: 0,
  inProgress: null,
  apiCalls: 0,
  estimatedTimeRemaining: "calculating..."
};

// Queue system for sequential processing
const generationQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

/**
 * Generates tests for all functions extracted from code files
 */
export async function generateTests(files: UploadedFile[]): Promise<GenerateTestsResponse> {
  try {
    // Get all functions that need tests
    const allFunctions = await storage.getAllFunctions();
    const functionsWithSpecs = allFunctions.filter(fn => fn.hasSpec);
    const functionsWithoutSpecs = allFunctions.filter(fn => !fn.hasSpec);
    
    // Initialize test generation state
    testGenerationState = {
      total: allFunctions.length,
      completed: 0,
      inProgress: null,
      apiCalls: 0,
      estimatedTimeRemaining: "calculating..."
    };
    
    // Get all specification files content for context
    const specFiles = files.filter(file => file.isSpecFile);
    const specContent = specFiles.map(file => file.content).join('\n\n');
    
    // First prioritize functions with specifications
    const functionQueue = [...functionsWithSpecs, ...functionsWithoutSpecs];
    
    // Generate test files from existing tests
    const existingTests = await storage.getAllTests();
    const existingTestsByFunctionId = new Map(
      existingTests.map(test => [test.functionId, test])
    );
    
    // Clear previous queue
    generationQueue.length = 0;
    
    // Add test generation tasks to queue
    for (const func of functionQueue) {
      generationQueue.push(async () => {
        try {
          // Skip if test already exists
          if (existingTestsByFunctionId.has(func.id)) {
            testGenerationState.completed++;
            return;
          }
          
          // Get file name for the function
          const codeFile = await storage.getCodeFileById(func.fileId);
          if (!codeFile) {
            throw new Error(`Code file not found for function ${func.name}`);
          }
          
          testGenerationState.inProgress = func.name;
          
          // Generate test file name
          const baseFileName = codeFile.name.replace(/\.(js|ts|jsx|tsx)$/, '');
          const testFileName = `${baseFileName}.test.${codeFile.name.endsWith('ts') || codeFile.name.endsWith('tsx') ? 'ts' : 'js'}`;
          
          // Extract specifications for this function from specs if available
          let functionSpec = '';
          if (func.hasSpec && specContent) {
            // Simple approach to extract relevant spec section
            const lines = specContent.split('\n');
            const functionNameIndex = lines.findIndex(line => 
              line.toLowerCase().includes(func.name.toLowerCase()) && 
              (line.includes('##') || line.includes('function') || line.includes('`'))
            );
            
            if (functionNameIndex >= 0) {
              // Extract a few lines after the function name mention
              functionSpec = lines.slice(functionNameIndex, functionNameIndex + 10).join('\n');
            }
          }
          
          // Generate tests
          const { testCode, testCount, coverage } = await generateTestCases({
            functionCode: func.code,
            functionName: func.name,
            specification: functionSpec,
            testType: 'both' // Generate both whitebox and blackbox tests
          });
          
          // Store generated test
          await storage.createTest({
            functionId: func.id,
            testCode,
            testFileName,
            testCount,
            testTypes: ['whitebox', 'blackbox'],
            coverage, // Save coverage metrics
            generated_at: new Date().toISOString()
          });
          
          // Update progress
          testGenerationState.completed++;
          testGenerationState.apiCalls++;
          
          // Update estimated time remaining
          const completedSoFar = testGenerationState.completed;
          const totalTasks = testGenerationState.total;
          const percentComplete = completedSoFar / totalTasks;
          
          if (percentComplete > 0) {
            // Assume each API call takes ~5 seconds on average
            const estimatedTotalTimeInSeconds = (totalTasks * 5);
            const estimatedTimeRemainingInSeconds = Math.ceil(estimatedTotalTimeInSeconds * (1 - percentComplete));
            
            if (estimatedTimeRemainingInSeconds < 60) {
              testGenerationState.estimatedTimeRemaining = `${estimatedTimeRemainingInSeconds}s`;
            } else {
              testGenerationState.estimatedTimeRemaining = `~${Math.ceil(estimatedTimeRemainingInSeconds / 60)} min`;
            }
          }
        } catch (error) {
          console.error(`Error generating test for ${func.name}:`, error);
          testGenerationState.completed++;
        } finally {
          testGenerationState.inProgress = null;
        }
      });
    }
    
    // Start processing the queue in the background
    processQueue();
    
    // Return initial state
    const initialTests = await storage.getAllTests();
    return {
      tests: initialTests.map(test => {
        const func = allFunctions.find(f => f.id === test.functionId);
        return {
          id: test.id.toString(),
          functionName: func?.name || 'unknown',
          fileName: func ? (allFunctions.find(f => f.id === func.fileId)?.name || 'unknown') : 'unknown',
          testFileName: test.testFileName,
          testCode: test.testCode,
          testCount: test.testCount,
          types: test.testTypes as string[],
          coverage: test.coverage as any // Forward coverage metrics to client
        };
      }),
      status: {...testGenerationState}
    };
  } catch (error) {
    console.error('Error in test generation:', error);
    throw new Error('Failed to generate tests: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Process the test generation queue sequentially
 */
async function processQueue() {
  if (isProcessing || generationQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  try {
    while (generationQueue.length > 0) {
      const task = generationQueue.shift();
      if (task) {
        await task();
      }
    }
  } catch (error) {
    console.error('Error processing test generation queue:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Get the current status of test generation
 */
export async function getTestGenerationStatus(): Promise<TestGenerationStatus> {
  return {...testGenerationState};
}
