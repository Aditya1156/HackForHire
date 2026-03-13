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

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const languageId = LANG_MAP[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

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
            source_code: code,
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
