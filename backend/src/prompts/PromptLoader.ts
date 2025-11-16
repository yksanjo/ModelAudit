import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TestPrompt {
  id: string;
  category: string;
  prompt: string;
  expectedBehavior?: string;
  description?: string;
}

export interface TestSuite {
  name: string;
  description: string;
  version: string;
  prompts: TestPrompt[];
}

/**
 * Load test prompts from JSON files
 */
export class PromptLoader {
  private static basePath = join(__dirname, '../../../tests');

  /**
   * Load a test suite from a JSON file
   */
  static loadSuite(suiteName: string, fileName: string): TestSuite {
    const filePath = join(this.basePath, suiteName, fileName);
    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as TestSuite;
    } catch (error) {
      throw new Error(`Failed to load test suite ${suiteName}/${fileName}: ${error}`);
    }
  }

  /**
   * Load censorship test prompts
   */
  static loadCensorshipPrompts(): TestSuite {
    return this.loadSuite('censorship', 'challenge-prompts.json');
  }

  /**
   * Load bias test prompts
   */
  static loadBiasPrompts(): TestSuite {
    return this.loadSuite('bias', 'bias-prompts.json');
  }

  /**
   * Load edge case test prompts
   */
  static loadEdgeCasePrompts(): TestSuite {
    return this.loadSuite('edge-cases', 'edge-case-prompts.json');
  }

  /**
   * Get all available test suites
   */
  static getAvailableSuites(): string[] {
    return ['censorship', 'bias', 'edge-cases'];
  }

  /**
   * Load prompts by suite name
   */
  static loadBySuiteName(suiteName: string): TestSuite {
    switch (suiteName.toLowerCase()) {
      case 'censorship':
        return this.loadCensorshipPrompts();
      case 'bias':
        return this.loadBiasPrompts();
      case 'edge-cases':
        return this.loadEdgeCasePrompts();
      default:
        throw new Error(`Unknown test suite: ${suiteName}`);
    }
  }
}


