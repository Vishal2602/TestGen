import * as esprima from 'esprima';
import * as ESTree from 'estree';
import { storage } from '../storage';
import { UploadedFile, ExtractedFunction, AnalysisResponse } from '@/lib/types';

/**
 * Analyzes JavaScript/TypeScript code files and extracts function information
 */
export async function analyzeCode(files: UploadedFile[]): Promise<AnalysisResponse> {
  try {
    const extractedFunctions: ExtractedFunction[] = [];
    const codeFiles = files.filter(file => !file.isSpecFile);
    const specFiles = files.filter(file => file.isSpecFile);
    
    // Save files to storage
    for (const file of files) {
      await storage.createCodeFile({
        name: file.name,
        content: file.content,
        type: file.type,
        size: file.size,
        isSpecFile: file.isSpecFile,
        uploaded_at: new Date().toISOString()
      });
    }
    
    // Extract functions from each code file
    for (const file of codeFiles) {
      const fileFunctions = extractFunctions(file.content, file.name);
      extractedFunctions.push(...fileFunctions);
      
      // Save extracted functions to storage
      for (const fn of fileFunctions) {
        const codeFile = await storage.getCodeFileByName(file.name);
        if (codeFile) {
          await storage.createFunction({
            name: fn.name,
            code: fn.code,
            params: fn.params as any, // Type adjustment
            returnType: fn.returnType,
            fileId: codeFile.id,
            hasSpec: false // Initially set to false
          });
        }
      }
    }
    
    // Extract specifications from spec files
    if (specFiles.length > 0) {
      const specMatches = matchSpecificationsToFunctions(specFiles, extractedFunctions);
      
      // Update function specs in storage
      const allFunctions = await storage.getAllFunctions();
      for (const fn of allFunctions) {
        const matchedExtractedFn = extractedFunctions.find(
          extractedFn => extractedFn.name === fn.name && 
                         extractedFn.hasSpec === true
        );
        
        if (matchedExtractedFn) {
          await storage.updateFunctionSpec(fn.id, true);
        }
      }
    }
    
    // Count matched specifications
    const matchedCount = extractedFunctions.filter(fn => fn.hasSpec).length;
    
    return {
      functions: extractedFunctions,
      specMatching: {
        matchedCount,
        totalFunctions: extractedFunctions.length
      }
    };
  } catch (error) {
    console.error('Error in code analysis:', error);
    throw new Error('Failed to analyze code: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Extracts functions from JavaScript/TypeScript code
 */
function extractFunctions(code: string, fileName: string): ExtractedFunction[] {
  try {
    const functions: ExtractedFunction[] = [];
    const ast = esprima.parseModule(code, { 
      range: true, 
      tokens: true,
      jsx: fileName.endsWith('.jsx') || fileName.endsWith('.tsx')
    });
    
    // Traverse AST to find functions
    traverseAST(ast, node => {
      // Function declaration
      if (node.type === 'FunctionDeclaration' && node.id) {
        const funcName = node.id.name;
        const params = node.params.map(getParamName);
        const codeRange = node.range;
        
        if (codeRange) {
          const functionCode = code.substring(codeRange[0], codeRange[1]);
          functions.push({
            id: `${fileName}-${funcName}`,
            name: funcName,
            code: functionCode,
            params,
            file: fileName,
            hasSpec: false
          });
        }
      }
      
      // Arrow function with variable declaration
      else if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          if (declarator.init && 
              (declarator.init.type === 'ArrowFunctionExpression' || 
               declarator.init.type === 'FunctionExpression') && 
              declarator.id && 
              declarator.id.type === 'Identifier') {
            
            const funcName = declarator.id.name;
            const arrowFunc = declarator.init;
            const params = arrowFunc.params.map(getParamName);
            const codeRange = declarator.range;
            
            if (codeRange) {
              const functionCode = code.substring(codeRange[0], codeRange[1]);
              functions.push({
                id: `${fileName}-${funcName}`,
                name: funcName,
                code: functionCode,
                params,
                file: fileName,
                hasSpec: false
              });
            }
          }
        }
      }
      
      // Method in class
      else if (node.type === 'MethodDefinition' && 
               node.key && 
               node.key.type === 'Identifier' &&
               node.value && 
               node.value.type === 'FunctionExpression') {
        
        const funcName = node.key.name;
        const params = node.value.params.map(getParamName);
        const codeRange = node.range;
        
        if (codeRange) {
          const functionCode = code.substring(codeRange[0], codeRange[1]);
          functions.push({
            id: `${fileName}-${funcName}`,
            name: funcName,
            code: functionCode,
            params,
            file: fileName,
            hasSpec: false
          });
        }
      }
      
      // Export named function
      else if (node.type === 'ExportNamedDeclaration' && 
               node.declaration && 
               node.declaration.type === 'FunctionDeclaration' &&
               node.declaration.id) {
        
        const funcName = node.declaration.id.name;
        const params = node.declaration.params.map(getParamName);
        const codeRange = node.declaration.range;
        
        if (codeRange) {
          const functionCode = code.substring(codeRange[0], codeRange[1]);
          functions.push({
            id: `${fileName}-${funcName}`,
            name: funcName,
            code: functionCode,
            params,
            file: fileName,
            hasSpec: false
          });
        }
      }
    });
    
    return functions;
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error);
    return [];
  }
}

/**
 * Helper function to traverse AST nodes
 */
function traverseAST(node: any, callback: (node: any) => void) {
  callback(node);
  
  for (const key in node) {
    if (node.hasOwnProperty(key)) {
      const child = node[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach(item => {
            if (item && typeof item === 'object') {
              traverseAST(item, callback);
            }
          });
        } else {
          traverseAST(child, callback);
        }
      }
    }
  }
}

/**
 * Helper function to get parameter names from AST nodes
 */
function getParamName(param: any): string {
  if (param.type === 'Identifier') {
    return param.name;
  } else if (param.type === 'AssignmentPattern' && param.left && param.left.type === 'Identifier') {
    return param.left.name;
  } else if (param.type === 'RestElement' && param.argument && param.argument.type === 'Identifier') {
    return `...${param.argument.name}`;
  } else if (param.type === 'ObjectPattern') {
    return '{...}';
  } else if (param.type === 'ArrayPattern') {
    return '[...]';
  }
  return 'param';
}

/**
 * Matches specifications from README files to extracted functions
 */
function matchSpecificationsToFunctions(
  specFiles: UploadedFile[], 
  functions: ExtractedFunction[]
): void {
  // Simple matching by function name in markdown headers
  for (const specFile of specFiles) {
    const content = specFile.content;
    const lines = content.split('\n');
    
    // Look for function declarations in markdown
    // Patterns like:
    // ### functionName(params)
    // ## functionName
    // Function: `functionName`
    
    for (const func of functions) {
      const functionNamePatterns = [
        new RegExp(`###\\s+${func.name}\\s*\\(`),
        new RegExp(`##\\s+${func.name}\\b`),
        new RegExp(`###\\s+${func.name}\\b`),
        new RegExp(`Function:\\s+\`${func.name}\``),
        new RegExp(`\\*\\*${func.name}\\*\\*\\s*\\(`),
        new RegExp(`\\b${func.name}\\(\\)`),
        new RegExp(`\\b${func.name}\\s+function\\b`)
      ];
      
      const hasMatch = functionNamePatterns.some(pattern => 
        lines.some(line => pattern.test(line))
      );
      
      if (hasMatch) {
        func.hasSpec = true;
      }
    }
  }
}
