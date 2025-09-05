import type { Method, CsvData } from '../types';

/**
 * Execute a transformation method on input data
 */
export function executeTransformation(
  method: Method,
  args: string[],
  inputRow: Record<string, string>
): string {
  try {
    // Resolve argument values from input row
    const resolvedArgs = args.map(arg => {
      // Check if argument is a column reference like {COLUMN_NAME}
      const columnMatch = arg.match(/^\{(.+)\}$/);
      if (columnMatch) {
        return inputRow[columnMatch[1]] || '';
      }
      // Try to parse as JSON if it looks like a complex value
      if (typeof arg === 'string' && (arg.startsWith('[') || arg.startsWith('{'))) {
        try {
          return JSON.parse(arg);
        } catch {
          return arg;
        }
      }
      return arg;
    });
    
    // Create a safe function execution context - wrap in IIFE to handle nested functions
    console.log('Executing method:', method.name);
    console.log('Method code:', method.code.substring(0, 200) + '...');
    console.log('Parameters:', method.parameters);
    console.log('Resolved args:', resolvedArgs);
    console.log('Args types:', resolvedArgs.map(arg => typeof arg));
    
    const func = new Function(...method.parameters, `
      try {
        console.log('Inside function - arguments:', Array.from(arguments));
        const fn = ${method.code};
        const result = fn(...arguments);
        console.log('Function result:', result);
        return result;
      } catch (error) {
        console.error('Error in function execution:', error);
        throw error;
      }
    `);
    
    const result = func(...resolvedArgs);
    return String(result || '');
  } catch (error) {
    console.error(`Error executing method ${method.name}:`, error);
    return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Parse transformation string to extract method name and arguments
 */
export function parseTransformation(transformation: string): {
  methodName: string;
  args: string[];
} | null {
  // Match pattern: methodName(arg1, arg2, ...)
  const match = transformation.match(/^(\w+)\((.*)\)$/);
  if (!match) return null;
  
  const methodName = match[1];
  const argsString = match[2].trim();
  
  if (!argsString) {
    return { methodName, args: [] };
  }
  
  // Parse arguments (simple comma-separated for now)
  const args = argsString.split(',').map(arg => arg.trim());
  
  return { methodName, args };
}

/**
 * Apply all mappings to transform input CSV to output CSV
 */
export function transformCsvData(
  inputData: CsvData,
  mappings: Array<{ 
    sourceColumn: string; 
    targetColumn: string; 
    transformation?: string;
    transformationMethod?: string;
    transformationParams?: string[];
    hasTransformation?: boolean;
    hasCustomTarget?: boolean;
    isActive: boolean 
  }> = [],
  methods: Method[] = []
): CsvData {
  const methodsMap = new Map(methods.map(m => [m.id, m]));
  
  // Get unique target columns from active mappings
  // Use sourceColumn as default if targetColumn is empty or hasCustomTarget is false
  const targetHeaders = Array.from(
    new Set(
      mappings
        .filter(m => m.isActive)
        .map(m => (m.hasCustomTarget && m.targetColumn) ? m.targetColumn : m.sourceColumn)
        .filter(Boolean)
    )
  );
  
  const outputRows: Record<string, string>[] = [];
  
  inputData.rows.forEach(inputRow => {
    const outputRow: Record<string, string> = {};
    
    mappings.forEach(mapping => {
      if (!mapping.isActive || !mapping.sourceColumn) return;
      
      // Use sourceColumn as targetColumn if targetColumn is empty or hasCustomTarget is false
      const targetColumn = (mapping.hasCustomTarget && mapping.targetColumn) ? mapping.targetColumn : mapping.sourceColumn;
      
      let value = '';
      
      // Check for new method-based transformation first (only if hasTransformation is true)
      if (mapping.hasTransformation && mapping.transformationMethod && methodsMap.has(mapping.transformationMethod)) {
        const method = methodsMap.get(mapping.transformationMethod)!;
        const params = mapping.transformationParams || [];
        console.log('Executing method:', method.name, 'with params:', params, 'for row:', inputRow);
        value = executeTransformation(method, params, inputRow);
        console.log('Method result:', value);
      } else if (mapping.hasTransformation && mapping.transformation && mapping.transformation.trim()) {
        // Fallback to old transformation string format
        const parsed = parseTransformation(mapping.transformation);
        if (parsed && methodsMap.has(parsed.methodName)) {
          const method = methodsMap.get(parsed.methodName)!;
          value = executeTransformation(method, parsed.args, inputRow);
        } else {
          // Treat as template string with column variables
          value = replaceColumnVariables(mapping.transformation, inputRow);
        }
      } else {
        // Direct column mapping - use original value when no transformation
        value = inputRow[mapping.sourceColumn] || '';
      }
      
      outputRow[targetColumn] = value;
    });
    
    outputRows.push(outputRow);
  });
  
  return {
    headers: targetHeaders,
    rows: outputRows
  };
}

/**
 * Replace column variables in a template string
 */
function replaceColumnVariables(template: string, row: Record<string, string>): string {
  return template.replace(/\{([^}]+)\}/g, (match, columnName) => {
    return row[columnName] || match;
  });
}

/**
 * Validate method code for basic safety
 */
export function validateMethodCode(code: string): { isValid: boolean; error?: string } {
  try {
    // Basic validation - check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /document\./,
      /window\./,
      /global\./,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /fetch\s*\(/,
      /XMLHttpRequest/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return { isValid: false, error: 'Code contains potentially unsafe operations' };
      }
    }
    
    // Try to create the function to check syntax
    new Function('return ' + code);
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JavaScript syntax' 
    };
  }
}
