import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import * as fs from 'fs';
import * as path from 'path';
import { FunctionInfo } from '@shared/schema';

interface ParsedFunction {
  name: string;
  params: { name: string; type?: string }[];
  returnType?: string;
  code: string;
  node: any;
  fileName: string;
}

export class AcornAnalyzer {
  /**
   * Parse a JavaScript file and extract functions
   */
  parseFile(fileContent: string, fileName: string): ParsedFunction[] {
    try {
      const ast = acorn.parse(fileContent, {
        ecmaVersion: 2020,
        sourceType: 'module',
        locations: true
      });

      const functions: ParsedFunction[] = [];

      // Extract function declarations (function name() {})
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
        }
      });

      // Extract function expressions (const name = function() {})
      walk.simple(ast, {
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
        }
      });

      // Extract class methods
      walk.simple(ast, {
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

      // Extract arrow function expressions (const name = () => {})
      walk.simple(ast, {
        VariableDeclaration: (node: any) => {
          node.declarations.forEach((decl: any) => {
            if (decl.init && decl.init.type === 'ArrowFunctionExpression') {
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
        }
      });

      return functions;
    } catch (error) {
      console.error(`Error parsing file ${fileName}:`, error);
      return [];
    }
  }

  /**
   * Infer parameter type from AST or JSDoc
   */
  inferTypeFromParam(param: any, code: string): string | undefined {
    // Try to infer type from JSDoc comments
    const comments = this.findJSDocForParam(param, code);
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

    // Try to infer from TypeScript annotations
    if (param.typeAnnotation) {
      return code.substring(param.typeAnnotation.start, param.typeAnnotation.end);
    }

    return undefined;
  }

  /**
   * Infer function return type from AST or JSDoc
   */
  inferReturnType(node: any, code: string): string | undefined {
    // Try to infer from JSDoc
    const comments = this.findJSDocForFunction(node, code);
    if (comments) {
      const returnTypeMatch = comments.match(/@returns?\s+\{([^}]+)\}/);
      if (returnTypeMatch) {
        return returnTypeMatch[1];
      }
    }

    // Try to infer from TypeScript return type
    if (node.returnType) {
      return code.substring(node.returnType.start, node.returnType.end);
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

  /**
   * Calculate cyclomatic complexity of a function
   */
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

  /**
   * Find JSDoc comments for a function
   */
  findJSDocForFunction(node: any, code: string): string | null {
    if (!node.loc) return null;
    
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

  /**
   * Find JSDoc comments for a parameter
   */
  findJSDocForParam(param: any, code: string): string | null {
    // For simplicity, we'll just look for the param name in JSDoc comments
    const paramName = param.name || (param.left && param.left.name);
    if (!paramName) return null;
    
    const paramPattern = new RegExp(`@param\\s+(\\{[^}]+\\}\\s+)?${paramName}\\b`, 'i');
    const matchResult = code.match(paramPattern);
    
    return matchResult ? matchResult[0] : null;
  }
}
