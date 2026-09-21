import { ToolDefinition } from '../types.js';

interface CalculatorInput {
  expression: string;
}

interface CalculatorOutput {
  expression: string;
  normalizedExpression: string;
  result: number | string;
  formattedResult: string;
  steps: string[];
}

export const calculatorTool: ToolDefinition<CalculatorInput, CalculatorOutput> = {
  name: 'calculator',
  description: 'Evaluates mathematical operations, formulas, percentages, unit calculations, and arithmetic expressions.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The math expression to evaluate, e.g. "125 * 47", "125 multiplied by 47", "20% of 850", "sqrt(144)"',
      },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    const raw = expression || '';
    let normalized = raw.toLowerCase()
      .replace(/multiplied by|times|x/gi, '*')
      .replace(/divided by|over/gi, '/')
      .replace(/plus/gi, '+')
      .replace(/minus/gi, '-')
      .replace(/percent of|% of/gi, '* 0.01 *')
      .replace(/percent|%/gi, '* 0.01')
      .replace(/to the power of|\^/gi, '**')
      .replace(/squared/gi, '** 2')
      .replace(/cubed/gi, '** 3')
      .replace(/square root of|sqrt/gi, 'Math.sqrt');

    // Clean any unwanted characters for security
    // Allow only digits, basic operators, Math functions, parentheses, commas, whitespace
    const sanitized = normalized.replace(/[^0-9+\-*/().,^%\sMath\.sqrtcbptieLogEPI]/g, '');

    const steps: string[] = [
      `Input expression: "${raw}"`,
      `Normalized form: "${sanitized}"`,
    ];

    try {
      const val = safeEvaluateMath(sanitized);

      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        throw new Error('Result is indeterminate or division by zero');
      }

      const formatted = Number.isInteger(val)
        ? val.toLocaleString('en-US')
        : val.toLocaleString('en-US', { maximumFractionDigits: 6 });

      steps.push(`Evaluated result: ${formatted}`);

      return {
        expression: raw,
        normalizedExpression: sanitized,
        result: val,
        formattedResult: formatted,
        steps,
      };
    } catch (err: any) {
      return {
        expression: raw,
        normalizedExpression: sanitized,
        result: 'Calculation Error',
        formattedResult: `Unable to compute "${raw}": ${err.message}`,
        steps: [...steps, `Error during computation: ${err.message}`],
      };
    }
  },
};

export function safeEvaluateMath(expr: string): number {
  const tokens = expr.match(/\d+(\.\d+)?|[+\-*/()]/g) || [];
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseFactor = (): number => {
    const token = consume();
    if (!token) throw new Error('Unexpected end of expression');
    if (token === '(') {
      const val = parseExpr();
      consume(); // ')'
      return val;
    }
    if (token === '-') return -parseFactor();
    if (token === '+') return parseFactor();
    const num = parseFloat(token);
    if (isNaN(num)) throw new Error(`Invalid numeric token: "${token}"`);
    return num;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const next = parseFactor();
      if (op === '/' && next === 0) throw new Error('Division by zero');
      val = op === '*' ? val * next : val / next;
    }
    return val;
  };

  const parseExpr = (): number => {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const next = parseTerm();
      val = op === '+' ? val + next : val - next;
    }
    return val;
  };

  const result = parseExpr();
  return result;
}
