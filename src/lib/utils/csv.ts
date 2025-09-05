import * as Papa from 'papaparse';
import type { CsvData, CsvParseOptions } from '../types';

export const DEFAULT_CSV_OPTIONS: CsvParseOptions = {
	delimiter: ',',
	quote: '"',
	escape: '"',
	hasHeader: true,
	trim: true,
	skipEmptyLines: true
};

/**
 * Parse CSV from File object using Papa Parse
 */
export async function parseCsvFromFile(file: File, options: Partial<CsvParseOptions> = {}): Promise<CsvData> {
	const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
	
	return new Promise((resolve, reject) => {
		Papa.parse(file as any, {
			header: opts.hasHeader,
			delimiter: opts.delimiter,
			quoteChar: opts.quote,
			escapeChar: opts.escape,
			skipEmptyLines: opts.skipEmptyLines,
			transform: opts.trim ? (value: string) => value.trim() : undefined,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.warn('CSV parsing warnings:', results.errors);
				}
				
				if (opts.hasHeader) {
					// Papa Parse returns objects with column names as keys
					const headers = results.meta.fields || [];
					const rows = results.data as Record<string, string>[];
					resolve({ headers, rows });
				} else {
					// Papa Parse returns arrays when header: false
					const data = results.data as string[][];
					if (data.length === 0) {
						resolve({ headers: [], rows: [] });
						return;
					}
					
					const headers = data[0].map((_, index) => `Column${index + 1}`);
					const rows = data.map((record) => {
						const row: Record<string, string> = {};
						headers.forEach((header, index) => {
							row[header] = String(record[index] || '');
						});
						return row;
					});
					resolve({ headers, rows });
				}
			},
			error: (error) => {
				console.error('CSV parsing error:', error);
				reject(error);
			}
		});
	});
}

/**
 * Detect the most likely delimiter in CSV text
 */
export function detectDelimiter(csvText: string): string {
	const sampleLines = csvText.split(/\r?\n/).slice(0, 10).filter(line => line.trim());
	const delimiters = [';', ',', '\t', '|']; // Prioritize semicolon first
	const scores: Record<string, number> = {};

	for (const delimiter of delimiters) {
		let totalCount = 0;
		const lineCounts: number[] = [];
		
		for (const line of sampleLines) {
			const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
			lineCounts.push(count);
			totalCount += count;
		}
		
		if (lineCounts.length === 0) {
			scores[delimiter] = 0;
			continue;
		}
		
		// Check consistency across lines
		const avgCount = totalCount / lineCounts.length;
		const variance = lineCounts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / lineCounts.length;
		const isConsistent = variance <= 1; // Low variance means consistent
		
		// Score based on total count and consistency
		scores[delimiter] = isConsistent && totalCount > 0 ? totalCount * (1 / (variance + 1)) : 0;
	}

	// Return delimiter with highest score
	const bestDelimiter = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
	return bestDelimiter || ',';
}

/**
 * Detect if the first line contains headers
 */
export function detectHeaders(csvText: string, delimiter: string = ','): boolean {
	const lines = csvText.split(/\r?\n/).filter(line => line.trim());
	if (lines.length < 2) return true;

	const firstLine = parseCSVLine(lines[0], delimiter, '"', '"');
	const secondLine = parseCSVLine(lines[1], delimiter, '"', '"');

	// Check if first line has different data types than second line
	let headerLikeCount = 0;
	
	for (let i = 0; i < Math.min(firstLine.length, secondLine.length); i++) {
		const first = firstLine[i]?.trim();
		const second = secondLine[i]?.trim();
		
		if (!first || !second) continue;
		
		// If first is text and second is number, likely header
		if (isNaN(Number(first)) && !isNaN(Number(second))) {
			headerLikeCount++;
		}
		
		// If first contains spaces/underscores (common in headers)
		if (first.includes(' ') || first.includes('_')) {
			headerLikeCount++;
		}
	}
	
	return headerLikeCount > 0;
}

/**
 * Parse CSV from text using Papa Parse (for backward compatibility)
 */
export function parseCsv(csvText: string, options: Partial<CsvParseOptions> = {}): CsvData {
	const opts = { ...DEFAULT_CSV_OPTIONS, ...options };
	
	// Auto-detect delimiter if not specified or if using default
	if (!options.delimiter || options.delimiter === DEFAULT_CSV_OPTIONS.delimiter) {
		opts.delimiter = detectDelimiter(csvText);
	}
	
	// Auto-detect headers if not explicitly set
	if (options.hasHeader === undefined) {
		opts.hasHeader = detectHeaders(csvText, opts.delimiter);
	}
	
	const results = Papa.parse(csvText, {
		header: opts.hasHeader,
		delimiter: opts.delimiter,
		quoteChar: opts.quote,
		escapeChar: opts.escape,
		skipEmptyLines: opts.skipEmptyLines,
		transform: opts.trim ? (value: string) => value.trim() : undefined,
	});
	
	if (results.errors.length > 0) {
		console.warn('CSV parsing warnings:', results.errors);
	}
	
	if (opts.hasHeader) {
		// Papa Parse returns objects with column names as keys
		const headers = results.meta.fields || [];
		const rows = results.data as Record<string, string>[];
		return { headers, rows };
	} else {
		// Papa Parse returns arrays when header: false
		const data = results.data as string[][];
		if (data.length === 0) {
			return { headers: [], rows: [] };
		}
		
		const headers = data[0].map((_, index) => `Column${index + 1}`);
		const rows = data.map((record) => {
			const row: Record<string, string> = {};
			headers.forEach((header, index) => {
				row[header] = String(record[index] || '');
			});
			return row;
		});
		return { headers, rows };
	}
}

/**
 * Convert structured data back to CSV text
 */
export function generateCsv(data: CsvData): string {
	if (!data.headers.length) return '';

	const csvLines: string[] = [];
	
	// Add headers
	csvLines.push(data.headers.map(escapeCSVField).join(','));
	
	// Add data rows
	data.rows.forEach(row => {
		const values = data.headers.map(header => escapeCSVField(row[header] || ''));
		csvLines.push(values.join(','));
	});

	return csvLines.join('\n');
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string, quote: string, escape: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];
		
		if (char === quote) {
			if (inQuotes && line[i + 1] === escape) {
				// Escaped quote
				current += quote;
				i += 2;
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
				i++;
			}
		} else if (char === delimiter && !inQuotes) {
			// Field separator
			result.push(current);
			current = '';
			i++;
		} else {
			current += char;
			i++;
		}
	}
	
	result.push(current);
	return result;
}

/**
 * Escape a field for CSV output
 */
function escapeCSVField(field: string): string {
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

/**
 * Download CSV data as a file
 */
export function downloadCsv(data: CsvData, filename: string = 'output.csv'): void {
	const csvContent = generateCsv(data);
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}
