import type { Method } from '../types';

/**
 * Parse a JavaScript function file and extract method information
 */
export function parseFunctionFile(fileContent: string, fileName: string): Method | null {
  try {
    // Extract function name from const declaration
    const functionNameMatch = fileContent.match(/const\s+(\w+)\s*=/);
    if (!functionNameMatch) return null;
    
    const functionName = functionNameMatch[1];
    
    // Extract JSDoc comment
    const jsdocMatch = fileContent.match(/\/\*\*([\s\S]*?)\*\//);
    const description = jsdocMatch ? extractDescription(jsdocMatch[1]) : '';
    
    // Extract parameters from JSDoc @param tags
    const parameters = extractParameters(fileContent);
    
    // Extract the arrow function part only
    const arrowFunctionMatch = fileContent.match(/const\s+\w+\s*=\s*(\([^)]*\)\s*=>\s*\{[\s\S]*?\});/);
    if (!arrowFunctionMatch) return null;
    
    let functionCode = arrowFunctionMatch[1].trim();
    
    console.log('Extracted function code:', functionCode.substring(0, 100) + '...');
    
    // Create the method object
    const method: Method = {
      id: `preset_${functionName}`,
      name: functionName,
      description: description || `Imported from ${fileName}`,
      parameters: parameters,
      code: functionCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return method;
  } catch (error) {
    console.error(`Error parsing function file ${fileName}:`, error);
    return null;
  }
}

/**
 * Extract description from JSDoc comment
 */
function extractDescription(jsdocContent: string): string {
  const lines = jsdocContent.split('\n');
  const descriptionLines: string[] = [];
  
  for (const line of lines) {
    const cleaned = line.replace(/^\s*\*\s?/, '').trim();
    if (cleaned.startsWith('@')) break;
    if (cleaned) descriptionLines.push(cleaned);
  }
  
  return descriptionLines.join(' ');
}

/**
 * Extract parameter names from the main function signature, not from nested functions
 */
function extractParameters(fileContent: string): string[] {
  // Extract the main arrow function parameters from the function signature
  const arrowFunctionMatch = fileContent.match(/const\s+\w+\s*=\s*\(([^)]*)\)\s*=>/);
  if (!arrowFunctionMatch) return [];
  
  const paramString = arrowFunctionMatch[1].trim();
  if (!paramString) return [];
  
  // Split parameters and clean them up
  const parameters = paramString.split(',').map(param => {
    // Remove default values and whitespace, extract just the parameter name
    return param.trim().split('=')[0].trim();
  }).filter(param => param.length > 0);
  
  return parameters;
}

/**
 * Parse all function files from the static functions directory
 */
export async function parseAllFunctionFiles(): Promise<Method[]> {
  const methods: Method[] = [];
  
  const functionFiles = [
    'getAccountNumber.js',
    'getPaddedAccount.js', 
    'getTaxCode.js'
  ];
  
  try {
    for (const fileName of functionFiles) {
      const response = await fetch(`/functions/${fileName}`);
      if (response.ok) {
        const content = await response.text();
        const method = parseFunctionFile(content, fileName);
        if (method) {
          methods.push(method);
        }
      } else {
        console.warn(`Failed to load function file: ${fileName}`);
      }
    }
  } catch (error) {
    console.error('Error loading function files:', error);
  }
  
  return methods;
}
