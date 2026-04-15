import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.replace(/\r$/g, ''));
}

export function parseCsv(content: string): CsvRow[] {
  const normalized = content.replace(/^\uFEFF/, '');
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

export async function readCsvFromRepoRoot(fileName: string): Promise<CsvRow[]> {
  const filePath = resolve(process.cwd(), fileName);
  const content = await readFile(filePath, 'utf-8');
  return parseCsv(content);
}
