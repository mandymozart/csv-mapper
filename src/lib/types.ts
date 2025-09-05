// Types for the CSV Mapper application

export interface Method {
  id: string;
  name: string;
  description?: string;
  code: string; // JavaScript function code
  parameters: string[]; // Parameter names for the function
}

export interface ColumnMapping {
  id: string;
  sourceColumn: string;
  targetColumn: string;
  transformation?: string; // Method name or direct value template
  isActive: boolean;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  mappings: ColumnMapping[];
  methods: Method[];
}

export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface AppState {
  currentProfile: Profile | null;
  profiles: Profile[];
  inputCsv: CsvData | null;
  outputCsv: CsvData | null;
  activeView: 'mappings' | 'methods';
  selectedMethod: string | null;
}

// CSV parsing options
export interface CsvParseOptions {
	delimiter: string;
	quote: string;
	escape: string;
	hasHeader: boolean;
	trim: boolean;
	skipEmptyLines: boolean;
}

// Utility types
export type ViewType = 'mappings' | 'methods';
