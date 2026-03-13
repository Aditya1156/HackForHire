const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY!;

const LANG_MAP: Record<string, number> = {
  python: 71,
  javascript: 63,
  cpp: 54,
  java: 62,
};

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface ExecutionResult {
  passed: number;
  total: number;
  results: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    time: string;
    memory: string;
    error?: string;
  }[];
}

/**
 * Wraps the student's code with a harness that reads stdin, calls the first
 * defined function, and prints the result. Students only write a function —
 * the harness handles I/O for all supported languages.
 */
function wrapCode(code: string, language: string): string {
  // If the student already handles I/O, run their code as-is
  const alreadyHandlesIO = (lang: string, src: string): boolean => {
    switch (lang) {
      case "python":
        return /\binput\s*\(/.test(src) || /\bprint\s*\(/.test(src);
      case "javascript":
        return /readline|process\.stdin|console\.log/.test(src);
      case "java":
        return /Scanner|System\.out|BufferedReader/.test(src);
      case "cpp":
        return /\bcin\b|cout|scanf|printf|getline/.test(src);
      default:
        return false;
    }
  };

  if (alreadyHandlesIO(language, code)) return code;

  switch (language) {
    case "python": {
      const match = code.match(/^def\s+(\w+)\s*\(/m);
      if (!match) return code;
      const fnName = match[1];
      return `${code}\n\nimport sys\n_input = sys.stdin.read().strip()\nprint(${fnName}(_input))\n`;
    }
    case "javascript": {
      const match = code.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/m);
      if (!match) return code;
      const fnName = match[1] || match[2];
      return `${code}\n\nconst _input = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconsole.log(${fnName}(_input));\n`;
    }
    case "cpp": {
      // Look for a standalone function (not main) like: string solve(string s)
      const match = code.match(/^\s*(?:[\w:<>]+)\s+(\w+)\s*\([^)]*\)\s*\{/m);
      if (!match || match[1] === "main") return code;
      const fnName = match[1];
      return `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

${code}

int main() {
    string _input;
    getline(cin, _input);
    cout << ${fnName}(_input) << endl;
    return 0;
}
`;
    }
    case "java": {
      // Look for a static method like: static String solve(String s)
      const match = code.match(/static\s+[\w<>\[\]]+\s+(\w+)\s*\(/m);
      if (!match || match[1] === "main") return code;
      const fnName = match[1];
      return `import java.util.*;
import java.io.*;

public class Main {
    ${code}

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String _input = br.readLine().trim();
        System.out.println(${fnName}(_input));
    }
}
`;
    }
    default:
      return code;
  }
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const languageId = LANG_MAP[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const wrappedCode = wrapCode(code, language);

  const results = await Promise.all(
    testCases.map(async (tc) => {
      try {
        const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify({
            source_code: wrappedCode,
            language_id: languageId,
            stdin: tc.input,
            expected_output: tc.expectedOutput,
            cpu_time_limit: 5,
            memory_limit: 262144, // 256MB
          }),
        });

        const data = await res.json();
        const actual = (data.stdout || "").trim();
        const isAccepted = data.status?.id === 3;

        return {
          input: tc.input,
          expected: tc.expectedOutput,
          actual,
          passed: isAccepted,
          time: data.time || "N/A",
          memory: data.memory ? `${Math.round(data.memory / 1024)} KB` : "N/A",
          error: data.stderr || data.compile_output || undefined,
        };
      } catch (error) {
        return {
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "",
          passed: false,
          time: "N/A",
          memory: "N/A",
          error: `Execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    })
  );

  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}
