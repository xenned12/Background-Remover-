/**
 * QA Test Framework and Assertion Library
 * Provides rich matchers, execution timers, and test results aggregation.
 */

export interface TestResult {
  suite: string;
  category: 'unit' | 'integration';
  name: string;
  status: 'passed' | 'failed';
  durationMs: number;
  assertionsCount: number;
  error?: string;
  stack?: string;
}

export interface SuiteResult {
  suite: string;
  category: 'unit' | 'integration';
  durationMs: number;
  passed: number;
  failed: number;
  total: number;
  tests: TestResult[];
}

export interface OverallTestSummary {
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalAssertions: number;
  totalDurationMs: number;
  suites: SuiteResult[];
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

class TestContext {
  public assertionCount = 0;

  public assert(condition: boolean, message: string, expected?: unknown, actual?: unknown) {
    this.assertionCount++;
    if (!condition) {
      const details =
        expected !== undefined && actual !== undefined
          ? `\n    Expected: ${JSON.stringify(expected)}\n    Received: ${JSON.stringify(actual)}`
          : '';
      throw new Error(`Assertion Failed: ${message}${details}`);
    }
  }
}

let currentContext: TestContext | null = null;

export function expect<T>(actual: T) {
  const ctx = currentContext;
  if (!ctx) {
    throw new Error('expect() must be called within a test/it block');
  }

  return {
    toBe(expected: T) {
      const match = Object.is(actual, expected);
      ctx.assert(match, `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`, expected, actual);
    },
    toEqual(expected: unknown) {
      const match = JSON.stringify(actual) === JSON.stringify(expected);
      ctx.assert(match, `Expected deep equality`, expected, actual);
    },
    toBeTruthy() {
      ctx.assert(Boolean(actual), `Expected ${JSON.stringify(actual)} to be truthy`, true, actual);
    },
    toBeFalsy() {
      ctx.assert(!actual, `Expected ${JSON.stringify(actual)} to be falsy`, false, actual);
    },
    toBeNull() {
      ctx.assert(actual === null, `Expected ${JSON.stringify(actual)} to be null`, null, actual);
    },
    toBeUndefined() {
      ctx.assert(actual === undefined, `Expected ${JSON.stringify(actual)} to be undefined`, undefined, actual);
    },
    toBeDefined() {
      ctx.assert(actual !== undefined, `Expected value to be defined`, 'defined', actual);
    },
    toBeGreaterThan(n: number) {
      ctx.assert(
        typeof actual === 'number' && actual > n,
        `Expected ${actual} > ${n}`,
        `> ${n}`,
        actual
      );
    },
    toBeGreaterThanOrEqual(n: number) {
      ctx.assert(
        typeof actual === 'number' && actual >= n,
        `Expected ${actual} >= ${n}`,
        `>= ${n}`,
        actual
      );
    },
    toBeLessThan(n: number) {
      ctx.assert(
        typeof actual === 'number' && actual < n,
        `Expected ${actual} < ${n}`,
        `< ${n}`,
        actual
      );
    },
    toBeLessThanOrEqual(n: number) {
      ctx.assert(
        typeof actual === 'number' && actual <= n,
        `Expected ${actual} <= ${n}`,
        `<= ${n}`,
        actual
      );
    },
    toContain(item: unknown) {
      if (Array.isArray(actual)) {
        ctx.assert(actual.includes(item), `Expected array to contain ${JSON.stringify(item)}`, item, actual);
      } else if (typeof actual === 'string') {
        ctx.assert(actual.includes(String(item)), `Expected string to contain "${item}"`, item, actual);
      } else {
        ctx.assert(false, `toContain expected array or string but received ${typeof actual}`);
      }
    },
    toHaveLength(len: number) {
      const actualLen = (actual as any)?.length;
      ctx.assert(
        actualLen === len,
        `Expected length ${len}, got ${actualLen}`,
        len,
        actualLen
      );
    },
    toMatch(regex: RegExp) {
      ctx.assert(
        typeof actual === 'string' && regex.test(actual),
        `Expected "${actual}" to match ${regex.toString()}`,
        regex.toString(),
        actual
      );
    },
    toBeCloseTo(expected: number, delta = 0.01) {
      const diff = Math.abs((actual as number) - expected);
      ctx.assert(
        diff <= delta,
        `Expected ${actual} to be close to ${expected} (within ${delta})`,
        expected,
        actual
      );
    },
  };
}

export type TestFn = () => void | Promise<void>;

export interface TestCase {
  name: string;
  fn: TestFn;
}

export class TestSuiteRunner {
  private tests: TestCase[] = [];
  public results: TestResult[] = [];

  constructor(
    public readonly name: string,
    public readonly category: 'unit' | 'integration'
  ) {}

  public test(name: string, fn: TestFn) {
    this.tests.push({ name, fn });
  }

  public it(name: string, fn: TestFn) {
    this.test(name, fn);
  }

  public async run(): Promise<SuiteResult> {
    const suiteStart = performance.now();
    let passed = 0;
    let failed = 0;

    console.log(`\n\x1b[1m\x1b[36m▶ Suite: [${this.category.toUpperCase()}] ${this.name}\x1b[0m`);

    for (const t of this.tests) {
      const ctx = new TestContext();
      currentContext = ctx;
      const testStart = performance.now();

      try {
        await t.fn();
        const duration = Math.round((performance.now() - testStart) * 100) / 100;
        passed++;
        this.results.push({
          suite: this.name,
          category: this.category,
          name: t.name,
          status: 'passed',
          durationMs: duration,
          assertionsCount: ctx.assertionCount,
        });
        console.log(`  \x1b[32m✔\x1b[0m ${t.name} \x1b[90m(${duration}ms, ${ctx.assertionCount} assertions)\x1b[0m`);
      } catch (err: any) {
        const duration = Math.round((performance.now() - testStart) * 100) / 100;
        failed++;
        this.results.push({
          suite: this.name,
          category: this.category,
          name: t.name,
          status: 'failed',
          durationMs: duration,
          assertionsCount: ctx.assertionCount,
          error: err.message || String(err),
          stack: err.stack,
        });
        console.error(`  \x1b[31m✖\x1b[0m ${t.name} \x1b[90m(${duration}ms)\x1b[0m`);
        console.error(`    \x1b[31m${err.message}\x1b[0m`);
      } finally {
        currentContext = null;
      }
    }

    const suiteDuration = Math.round((performance.now() - suiteStart) * 100) / 100;
    return {
      suite: this.name,
      category: this.category,
      durationMs: suiteDuration,
      passed,
      failed,
      total: this.tests.length,
      tests: this.results,
    };
  }
}
