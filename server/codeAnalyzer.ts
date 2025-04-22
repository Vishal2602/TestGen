import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { FunctionInfo, Specification } from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

interface ParsedFunction {
  name: string;
  params: { name: string; type?: string }[];
  returnType?: string;
  code: string;
  node: any;
  fileName: string;
}

export class CodeAnalyzer {
  async analyzeFiles(filePaths: string[]): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];

    for (const filePath of filePaths) {
      try {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const parsedFunctions = this.parseFile(fileContent, path.basename(filePath));
        
        // Calculate complexity for each function
        parsedFunctions.forEach(func => {
          const complexity = this.calculateComplexity(func.node);
          functions.push({
            name: func.name,
            params: func.params,
            returnType: func.returnType,
            fileName: func.fileName,
            code: func.code,
            complexity
          });
        });
      } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error);
      }
    }

    return functions;
  }

  parseFile(fileContent: string, fileName: string): ParsedFunction[] {
    try {
      const ast = acorn.parse(fileContent, {
        ecmaVersion: 2020,
        sourceType: 'module',
        locations: true
      });

      const functions: ParsedFunction[] = [];

      walk.simple(ast, {
        FunctionDeclaration: (node: any) => {
          const funcName = node.id?.name;
          if (funcName) {
            const params = node.params.map((param: any) => {
              return { 
                name: param.name || (param.left && param.left.name) || 'param',
                type: this.inferTypeFromParam(param, fileContent)
              };
            });

            const code = fileContent.substring(node.start, node.end);
            
            functions.push({
              name: funcName,
              params,
              returnType: this.inferReturnType(node, fileContent),
              code,
              node,
              fileName
            });
          }
        },
        VariableDeclaration: (node: any) => {
          node.declarations.forEach((decl: any) => {
            if (decl.init && 
                (decl.init.type === 'FunctionExpression' || decl.init.type === 'ArrowFunctionExpression')) {
              const funcName = decl.id.name;
              
              const params = decl.init.params.map((param: any) => {
                return { 
                  name: param.name || (param.left && param.left.name) || 'param',
                  type: this.inferTypeFromParam(param, fileContent)
                };
              });

              const code = fileContent.substring(node.start, node.end);
              
              functions.push({
                name: funcName,
                params,
                returnType: this.inferReturnType(decl.init, fileContent),
                code,
                node: decl.init,
                fileName
              });
            }
          });
        },
        MethodDefinition: (node: any) => {
          if (node.kind === 'method') {
            const methodName = node.key.name || (node.key.value);
            
            const params = node.value.params.map((param: any) => {
              return { 
                name: param.name || (param.left && param.left.name) || 'param',
                type: this.inferTypeFromParam(param, fileContent)
              };
            });

            const code = fileContent.substring(node.start, node.end);
            
            functions.push({
              name: methodName,
              params,
              returnType: this.inferReturnType(node.value, fileContent),
              code,
              node: node.value,
              fileName
            });
          }
        }
      });

      return functions;
    } catch (error) {
      console.error(`Error parsing file ${fileName}:`, error);
      return [];
    }
  }

  inferTypeFromParam(param: any, code: string): string | undefined {
    // Try to infer type from JSDoc comments
    const comments = findJSDocForParam(param, code);
    if (comments) {
      const paramTypeMatch = comments.match(/@param\s+\{([^}]+)\}\s+/);
      if (paramTypeMatch) {
        return paramTypeMatch[1];
      }
    }

    // Try to infer from default values
    if (param.right) {
      if (param.right.type === 'Literal') {
        if (typeof param.right.value === 'string') return 'string';
        if (typeof param.right.value === 'number') return 'number';
        if (typeof param.right.value === 'boolean') return 'boolean';
      } else if (param.right.type === 'ArrayExpression') {
        return 'Array';
      } else if (param.right.type === 'ObjectExpression') {
        return 'Object';
      }
    }

    return undefined;
  }

  inferReturnType(node: any, code: string): string | undefined {
    // Try to infer from JSDoc
    const comments = findJSDocForFunction(node, code);
    if (comments) {
      const returnTypeMatch = comments.match(/@returns?\s+\{([^}]+)\}/);
      if (returnTypeMatch) {
        return returnTypeMatch[1];
      }
    }

    // Try to infer from return statements
    let returnType: string | undefined;
    walk.simple(node, {
      ReturnStatement: (returnNode: any) => {
        if (!returnNode.argument) {
          returnType = returnType || 'void';
          return;
        }

        if (returnNode.argument.type === 'Literal') {
          const valueType = typeof returnNode.argument.value;
          returnType = valueType === 'undefined' ? 'void' : valueType;
        } else if (returnNode.argument.type === 'ArrayExpression') {
          returnType = 'Array';
        } else if (returnNode.argument.type === 'ObjectExpression') {
          returnType = 'Object';
        } else if (returnNode.argument.type === 'BinaryExpression') {
          if (['==', '===', '!=', '!==', '<', '>', '<=', '>='].includes(returnNode.argument.operator)) {
            returnType = 'boolean';
          } else {
            returnType = 'number';
          }
        }
      }
    });

    return returnType;
  }

  calculateComplexity(node: any): number {
    let complexity = 1; // Base complexity

    // Walk the AST and increase complexity for control flow statements
    walk.simple(node, {
      IfStatement: () => { complexity++; },
      ForStatement: () => { complexity++; },
      ForInStatement: () => { complexity++; },
      ForOfStatement: () => { complexity++; },
      WhileStatement: () => { complexity++; },
      DoWhileStatement: () => { complexity++; },
      SwitchCase: () => { complexity++; },
      ConditionalExpression: () => { complexity++; }, // ternary operator
      LogicalExpression: (node: any) => {
        if (node.operator === '&&' || node.operator === '||') {
          complexity++;
        }
      }
    });

    return complexity;
  }

  extractSpecifications(readmeContent: string): Specification[] {
    const specifications: Specification[] = [];
    
    // Look for function-like patterns in the README
    // Pattern: function_name(params): description
    const functionPattern = /\*\*([a-zA-Z0-9_]+)\(([^)]*)\)\*\*:?\s*(.*?)(?=\n\n|\n\*\*|\n-|\n\d|$)/g;
    let match;
    
    while ((match = functionPattern.exec(readmeContent)) !== null) {
      const functionName = match[1];
      const description = match[3].trim();
      
      specifications.push({
        description: `${functionName}(${match[2]}): ${description}`,
        mappedFunction: functionName,
        confidence: 90 // High confidence for exact name matches
      });
    }
    
    // Look for bullet point descriptions
    const bulletPattern = /-\s*\*\*([a-zA-Z0-9_]+)\*\*:?\s*(.*?)(?=\n\n|\n-|\n\*\*|\n\d|$)/g;
    
    while ((match = bulletPattern.exec(readmeContent)) !== null) {
      const functionName = match[1];
      const description = match[2].trim();
      
      specifications.push({
        description: `${functionName}: ${description}`,
        mappedFunction: functionName,
        confidence: 85
      });
    }
    
    return specifications;
  }
}

// Helper functions to find JSDoc comments
function findJSDocForFunction(node: any, code: string): string | null {
  const linesBefore = code.substring(0, node.start).split('\n');
  const startLine = node.loc.start.line;
  
  let commentLines = [];
  for (let i = startLine - 1; i >= 0; i--) {
    const line = linesBefore[i]?.trim();
    if (!line) continue;
    
    if (line.endsWith('*/')) {
      // Start of a JSDoc comment block (reading backwards)
      commentLines.push(line);
      let j = i - 1;
      while (j >= 0) {
        const commentLine = linesBefore[j]?.trim();
        if (commentLine?.startsWith('/*')) {
          commentLines.push(commentLine);
          break;
        }
        commentLines.push(commentLine || '');
        j--;
      }
      break;
    } else if (!line.startsWith('*') && !line.startsWith('//')) {
      // This is not part of a comment, so stop searching
      break;
    }
  }
  
  return commentLines.length > 0 ? commentLines.reverse().join('\n') : null;
}

function findJSDocForParam(param: any, code: string): string | null {
  // For simplicity, we'll just look for the param name in JSDoc comments
  const paramName = param.name || (param.left && param.left.name);
  if (!paramName) return null;
  
  const paramPattern = new RegExp(`@param\\s+(\\{[^}]+\\}\\s+)?${paramName}\\b`, 'i');
  const matchResult = code.match(paramPattern);
  
  return matchResult ? matchResult[0] : null;
}
