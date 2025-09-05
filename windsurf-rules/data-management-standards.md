# Data Management Standards

## CSV Processing

### Papa Parse Configuration
```javascript
import Papa from 'papaparse';

// Standard parsing configuration
const parseConfig = {
  header: true,           // Use first row as headers
  skipEmptyLines: true,   // Skip empty rows
  trimHeaders: true,      // Remove whitespace from headers
  dynamicTyping: false    // Keep all values as strings for consistency
};
```

### File Handling
- Always validate file type before processing
- Handle large files with streaming when possible
- Provide progress feedback for long operations
- Implement error recovery for malformed CSV files

## Profile Management

### Profile Structure
```typescript
interface Profile {
  id: string;
  name: string;
  mappings: Mapping[];
  methods: Method[];
  createdAt: string;
  updatedAt: string;
}

interface Mapping {
  sourceColumn: string;
  targetColumn?: string;    // Optional - defaults to sourceColumn
  transformation?: string;  // Optional - defaults to pass-through
  isActive: boolean;
}
```

### Storage Standards
- Use localStorage for client-side persistence
- Implement data validation on load
- Handle storage quota exceeded errors
- Provide data migration for schema changes

## Project Import/Export

### Export Process
1. Prompt user for filename with default suggestion
2. Ensure `.json` extension is added if missing
3. Include metadata: name, version, timestamp
4. Validate data before export
5. Handle export cancellation gracefully

### Import Process
1. Validate file extension (`.json` only)
2. Parse and validate JSON structure
3. Check for required fields
4. Validate profile data integrity
5. Provide detailed error messages for failures

### Project File Format
```json
{
  "name": "CSV Mapper Project",
  "version": "1.0.0",
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "profiles": [
    {
      "id": "unique-id",
      "name": "Profile Name",
      "mappings": [...],
      "methods": [...],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Data Transformation

### Transformation Rules
- Source column is always required
- Target column defaults to source column if empty
- Transformation is optional - defaults to pass-through
- Support variable substitution: `{columnName}`
- Support method calls: `methodName(arg1, arg2)`

### Method Execution
```javascript
// Method structure
interface Method {
  name: string;
  code: string;
  description?: string;
}

// Safe method execution
function executeMethod(method, args, rowData) {
  try {
    // Create safe execution context
    const func = new Function('args', 'row', method.code);
    return func(args, rowData);
  } catch (error) {
    console.error(`Method execution failed: ${error.message}`);
    return '';
  }
}
```

## Error Handling

### User-Facing Errors
- Provide clear, actionable error messages
- Include context about what went wrong
- Suggest solutions when possible
- Log technical details for debugging

### Data Validation
```javascript
// Example validation function
function validateProfile(profile) {
  const errors = [];
  
  if (!profile.name?.trim()) {
    errors.push('Profile name is required');
  }
  
  if (!Array.isArray(profile.mappings)) {
    errors.push('Profile mappings must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Performance Considerations

### Large Dataset Handling
- Implement pagination for preview displays
- Use virtual scrolling for large tables
- Process data in chunks to avoid blocking UI
- Show progress indicators for long operations

### Memory Management
- Clean up large objects when no longer needed
- Avoid keeping multiple copies of large datasets
- Use streaming for file operations when possible
- Monitor memory usage in development
