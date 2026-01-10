/**
 * Stdlib Types
 *
 * Common types for game standard libraries.
 * Functions are stored by name for frontend access.
 */

/**
 * A stdlib function definition with metadata
 */
export interface StdlibFunction {
  /** Function name in English */
  name: string;
  /** Function name in Chinese */
  nameZh: string;
  /** Description in English */
  description: string;
  /** Description in Chinese */
  descriptionZh: string;
  /** Function parameters */
  params?: Array<{
    name: string;
    nameZh: string;
    type: 'number' | 'string' | 'boolean' | 'any';
  }>;
  /** Return type */
  returns?: 'number' | 'string' | 'boolean' | 'void' | 'any';
  /** Category for grouping in UI */
  category: 'movement' | 'action' | 'sensor' | 'helper' | 'constant';
  /** The MiniPython function code */
  code: string;
}

/**
 * A complete stdlib with functions and constants
 */
export interface Stdlib {
  /** Game type this stdlib is for */
  gameType: string;
  /** All stdlib functions indexed by name */
  functions: Record<string, StdlibFunction>;
  /** Preamble code (constants, helper setup) - not shown in function list */
  preamble: string;
}

/**
 * Build full stdlib string from Stdlib object
 */
export function buildStdlibString(stdlib: Stdlib): string {
  const functionCodes = Object.values(stdlib.functions)
    .map((f) => f.code)
    .join('\n\n');

  return `${stdlib.preamble}\n\n${functionCodes}`;
}

/**
 * Get number of lines in a stdlib string (for line number offset calculation)
 */
export function getStdlibLineCount(stdlibString: string): number {
  return stdlibString.split('\n').length;
}
