import * as fs from 'fs';
import * as path from 'path';
import { FunctionInfo, Specification } from '@shared/schema';

export class InputProcessor {
  /**
   * Extract specifications from a README.md or text file
   */
  extractSpecifications(fileContent: string): Specification[] {
    const specifications: Specification[] = [];
    
    // Look for function-like patterns in the README
    // Pattern: function_name(params): description
    const functionPattern = /\*\*([a-zA-Z0-9_]+)\(([^)]*)\)\*\*:?\s*(.*?)(?=\n\n|\n\*\*|\n-|\n\d|$)/g;
    let match;
    
    while ((match = functionPattern.exec(fileContent)) !== null) {
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
    
    while ((match = bulletPattern.exec(fileContent)) !== null) {
      const functionName = match[1];
      const description = match[2].trim();
      
      specifications.push({
        description: `${functionName}: ${description}`,
        mappedFunction: functionName,
        confidence: 85
      });
    }
    
    // Look for function lists in code blocks
    const codeBlockPattern = /```(?:js|javascript)?\n([\s\S]*?)```/g;
    while ((match = codeBlockPattern.exec(fileContent)) !== null) {
      const codeBlock = match[1];
      const functionDefPattern = /(?:function\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)[^{]*?{/g;
      let funcMatch;
      
      while ((funcMatch = functionDefPattern.exec(codeBlock)) !== null) {
        const functionName = funcMatch[1];
        const params = funcMatch[2];
        
        // We don't have a clear description, but we can extract the function signature
        specifications.push({
          description: `${functionName}(${params}): Extracted from code block`,
          mappedFunction: functionName,
          confidence: 80
        });
      }
    }
    
    // Look for general descriptions in Requirements or Features sections
    const requirementPattern = /(?:##\s*Requirements|##\s*Features)([\s\S]*?)(?=##|$)/g;
    while ((match = requirementPattern.exec(fileContent)) !== null) {
      const section = match[1];
      const requirementLines = section.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('*'));
      
      for (const line of requirementLines) {
        // Look for function mentions in requirements
        const funcMention = line.match(/([a-zA-Z0-9_]+)\(.*?\)/);
        if (funcMention) {
          specifications.push({
            description: line.replace(/^[-*]\s*/, ''),
            mappedFunction: funcMention[1],
            confidence: 70
          });
        }
      }
    }
    
    return specifications;
  }

  /**
   * Match specifications to functions using name similarity
   */
  matchSpecificationsToFunctions(specifications: Specification[], functions: FunctionInfo[]): Specification[] {
    return specifications.map(spec => {
      // If we already have a mapped function with high confidence, keep it
      if (spec.mappedFunction && spec.confidence && spec.confidence > 80) {
        // Verify that the function actually exists
        const functionExists = functions.some(f => f.name === spec.mappedFunction);
        if (functionExists) {
          return spec;
        }
      }
      
      // Extract potential function name from description
      const funcNameMatch = spec.description.match(/^([a-zA-Z0-9_]+)(?:\(|:)/);
      if (funcNameMatch) {
        const candidateName = funcNameMatch[1];
        
        // Look for exact match
        const exactMatch = functions.find(f => f.name === candidateName);
        if (exactMatch) {
          return {
            ...spec,
            mappedFunction: exactMatch.name,
            confidence: 95
          };
        }
        
        // Look for case-insensitive match
        const caseInsensitiveMatch = functions.find(
          f => f.name.toLowerCase() === candidateName.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          return {
            ...spec,
            mappedFunction: caseInsensitiveMatch.name,
            confidence: 90
          };
        }
        
        // Look for fuzzy match (substring)
        const fuzzyMatches = functions.filter(
          f => f.name.includes(candidateName) || candidateName.includes(f.name)
        );
        if (fuzzyMatches.length === 1) {
          return {
            ...spec,
            mappedFunction: fuzzyMatches[0].name,
            confidence: 75
          };
        }
      }
      
      // If no match is found, leave unmapped
      return {
        ...spec,
        mappedFunction: undefined,
        confidence: undefined
      };
    });
  }

  /**
   * Validate JavaScript files
   */
  validateJavaScriptFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx'].includes(extension);
  }

  /**
   * Validate specification file
   */
  validateSpecFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return ['.md', '.txt'].includes(extension);
  }
}
