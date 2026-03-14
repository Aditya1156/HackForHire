/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Seed script: 50 folders × 10 questions = 500 questions
 * Run: npx tsx scripts/seed-questions.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGO = process.env.MONGODB_URI!;
const ADMIN_ID = new mongoose.Types.ObjectId(); // placeholder admin

// ─── Schema copies (standalone script, no Next.js) ───
const FolderSchema = new mongoose.Schema({
  name: String, description: String, domain: String,
  tags: [String], questionCount: Number, fetchCount: Number,
  isPublished: Boolean, createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const QuestionSchema = new mongoose.Schema({
  folderId: mongoose.Schema.Types.ObjectId,
  domain: String, type: String, difficulty: String,
  answerFormat: String, isTemporary: Boolean,
  content: {
    text: String, formula: String, imageUrl: String, audioUrl: String,
    instructions: String, wordLimit: String,
    options: [{ label: String, text: String, isCorrect: Boolean }],
    blanks: [{ id: Number, correctAnswer: String }],
    matchingPairs: [{ id: Number, item: String, correctMatch: String }],
    multiSelectCorrect: [String],
  },
  rubric: { criteria: [{ name: String, weight: Number, description: String }], maxScore: Number, gradingLogic: String },
  expectedAnswer: String,
  testCases: [{ input: String, expectedOutput: String }],
  tags: [String], createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const Folder = mongoose.models.QuestionFolder || mongoose.model("QuestionFolder", FolderSchema);
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// ─── Helper ───
function mcq(text: string, a: string, b: string, c: string, d: string, correct: "A"|"B"|"C"|"D", difficulty: "easy"|"medium"|"hard" = "medium") {
  const labels = ["A","B","C","D"];
  const opts = [a,b,c,d];
  return {
    type: "mcq", answerFormat: "mcq", difficulty,
    content: { text, options: labels.map((l,i) => ({ label: l, text: opts[i], isCorrect: l === correct })) },
    expectedAnswer: correct,
    rubric: { criteria: [{ name: "Correctness", weight: 1, description: "Correct option selected" }], maxScore: 1, gradingLogic: "1 if correct, 0 if wrong" },
  };
}

function text(t: string, expected: string, difficulty: "easy"|"medium"|"hard" = "medium", instructions?: string) {
  return {
    type: "text", answerFormat: "text", difficulty,
    content: { text: t, instructions: instructions || "" },
    expectedAnswer: expected,
    rubric: { criteria: [
      { name: "Correctness", weight: 0.5, description: "Answer is factually correct" },
      { name: "Clarity", weight: 0.3, description: "Clear and well-structured" },
      { name: "Completeness", weight: 0.2, description: "Covers all key points" },
    ], maxScore: 10, gradingLogic: "Evaluate correctness, clarity, completeness" },
  };
}

function code(t: string, expected: string, testCases: {input:string,expectedOutput:string}[], difficulty: "easy"|"medium"|"hard" = "medium") {
  return {
    type: "code", answerFormat: "code", difficulty,
    content: { text: t, instructions: "Write a complete solution that reads from stdin and prints to stdout." },
    expectedAnswer: expected,
    testCases,
    rubric: { criteria: [
      { name: "Correctness", weight: 0.6, description: "Passes test cases" },
      { name: "Efficiency", weight: 0.2, description: "Time/space complexity" },
      { name: "Code Quality", weight: 0.2, description: "Clean readable code" },
    ], maxScore: 10, gradingLogic: "Run test cases, evaluate efficiency and quality" },
  };
}

// ═══════════════════════════════════════════════════════
// 50 FOLDERS WITH 10 QUESTIONS EACH
// ═══════════════════════════════════════════════════════
const FOLDERS: { name: string; domain: string; tags: string[]; questions: any[] }[] = [

// ─── 1. Python Basics ───
{ name: "Python Basics", domain: "coding", tags: ["python", "sde", "coding", "beginner"],
  questions: [
    mcq("What is the output of print(type([]))?", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'set'>", "A", "easy"),
    mcq("Which keyword is used to define a function in Python?", "func", "define", "def", "function", "C", "easy"),
    mcq("What does len('hello') return?", "4", "5", "6", "Error", "B", "easy"),
    mcq("Which of these is immutable?", "list", "dict", "set", "tuple", "D", "easy"),
    text("Explain the difference between a list and a tuple in Python.", "Lists are mutable (can be changed after creation) while tuples are immutable (cannot be changed). Lists use square brackets [], tuples use parentheses (). Tuples are faster and can be used as dictionary keys.", "medium"),
    text("What are Python decorators? Give an example.", "Decorators are functions that modify the behavior of another function. They use @decorator_name syntax. Example: @staticmethod, @property, or custom decorators using functools.wraps.", "hard"),
    code("Write a function that returns the factorial of a number n.", "def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n-1)\n\nn = int(input())\nprint(factorial(n))", [
      { input: "5", expectedOutput: "120" }, { input: "0", expectedOutput: "1" }, { input: "10", expectedOutput: "3628800" }
    ], "easy"),
    code("Write a program that checks if a string is a palindrome.", "s = input().strip()\nprint('Yes' if s == s[::-1] else 'No')", [
      { input: "racecar", expectedOutput: "Yes" }, { input: "hello", expectedOutput: "No" }, { input: "madam", expectedOutput: "Yes" }
    ], "easy"),
    code("Write a program to find the second largest number in a list of space-separated integers.", "nums = list(map(int, input().split()))\nnums = list(set(nums))\nnums.sort()\nprint(nums[-2])", [
      { input: "1 2 3 4 5", expectedOutput: "4" }, { input: "10 10 5 3", expectedOutput: "5" }
    ], "medium"),
    mcq("What is the output of print(2**3**2)?", "64", "512", "8", "6", "B", "hard"),
  ]
},

// ─── 2. JavaScript Fundamentals ───
{ name: "JavaScript Fundamentals", domain: "coding", tags: ["javascript", "frontend developer", "web developer", "coding"],
  questions: [
    mcq("Which company developed JavaScript?", "Microsoft", "Netscape", "Google", "Apple", "B", "easy"),
    mcq("What does '===' check in JavaScript?", "Value only", "Type only", "Value and type", "Reference", "C", "easy"),
    mcq("What is the output of typeof null?", "'null'", "'undefined'", "'object'", "'boolean'", "C", "medium"),
    mcq("Which method removes the last element from an array?", "shift()", "pop()", "splice()", "slice()", "B", "easy"),
    text("Explain closures in JavaScript with an example.", "A closure is a function that has access to variables in its outer (enclosing) function's scope, even after the outer function has returned. Example: function outer() { let count = 0; return function inner() { count++; return count; } } — inner() is a closure that remembers count.", "hard"),
    text("What is the difference between let, const, and var?", "var is function-scoped and hoisted; let is block-scoped and not hoisted; const is block-scoped, not hoisted, and cannot be reassigned. let and const were introduced in ES6.", "medium"),
    code("Write a function to reverse a string.", "const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconsole.log(s.split('').reverse().join(''));", [
      { input: "hello", expectedOutput: "olleh" }, { input: "JavaScript", expectedOutput: "tpircSavaJ" }
    ], "easy"),
    code("Write a function to find the most frequent character in a string.", "const s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconst freq = {};\nfor (const c of s) freq[c] = (freq[c]||0)+1;\nlet max = 0, ch = '';\nfor (const [k,v] of Object.entries(freq)) if (v > max) { max = v; ch = k; }\nconsole.log(ch);", [
      { input: "aabbccc", expectedOutput: "c" }, { input: "hello", expectedOutput: "l" }
    ], "medium"),
    mcq("What does Promise.all() return if one promise rejects?", "All resolved values", "The first resolved value", "A rejected promise", "undefined", "C", "medium"),
    text("Explain event bubbling and event capturing.", "Event bubbling: events propagate from the target element up to the root (inside out). Event capturing: events propagate from the root down to the target (outside in). Use addEventListener's third parameter (true) for capturing. stopPropagation() prevents further propagation.", "hard"),
  ]
},

// ─── 3. Data Structures ───
{ name: "Data Structures", domain: "coding", tags: ["data structures", "sde", "coding", "dsa"],
  questions: [
    mcq("What is the time complexity of searching in a balanced BST?", "O(1)", "O(log n)", "O(n)", "O(n²)", "B", "easy"),
    mcq("Which data structure uses FIFO?", "Stack", "Queue", "Tree", "Graph", "B", "easy"),
    mcq("What is the worst-case time complexity of quicksort?", "O(n log n)", "O(n)", "O(n²)", "O(log n)", "C", "medium"),
    text("Explain the difference between a stack and a queue.", "Stack follows LIFO (Last In First Out) — push/pop from the top. Queue follows FIFO (First In First Out) — enqueue at rear, dequeue from front. Stack example: undo operations. Queue example: print job scheduling.", "easy"),
    text("What is a hash collision and how can it be resolved?", "A hash collision occurs when two different keys produce the same hash value. Resolution methods: 1) Chaining — store colliding elements in a linked list at the same index. 2) Open addressing — probe for the next empty slot (linear probing, quadratic probing, double hashing).", "medium"),
    code("Implement a stack using an array and perform push, pop operations. Input: operations as 'push X' or 'pop'. Print popped values.", "import sys\nstack = []\nfor line in sys.stdin:\n    line = line.strip()\n    if line.startswith('push'):\n        stack.append(int(line.split()[1]))\n    elif line == 'pop':\n        print(stack.pop() if stack else -1)", [
      { input: "push 5\npush 10\npop\npop", expectedOutput: "10\n5" }
    ], "medium"),
    code("Given a string of parentheses, check if they are balanced.", "s = input().strip()\nstack = []\nvalid = True\nfor c in s:\n    if c in '({[':\n        stack.append(c)\n    else:\n        if not stack: valid = False; break\n        t = stack.pop()\n        if (c == ')' and t != '(') or (c == '}' and t != '{') or (c == ']' and t != '['): valid = False; break\nif stack: valid = False\nprint('Yes' if valid else 'No')", [
      { input: "(())", expectedOutput: "Yes" }, { input: "({[]})", expectedOutput: "Yes" }, { input: "(]", expectedOutput: "No" }
    ], "medium"),
    mcq("In a min-heap, the parent node is:", "Greater than children", "Less than or equal to children", "Equal to children", "Random", "B", "easy"),
    text("Explain BFS vs DFS with use cases.", "BFS (Breadth-First Search) explores level by level using a queue. Best for shortest path in unweighted graphs. DFS (Depth-First Search) explores as deep as possible using a stack/recursion. Best for topological sorting, cycle detection, maze solving.", "medium"),
    mcq("What is the space complexity of a linked list with n nodes?", "O(1)", "O(log n)", "O(n)", "O(n²)", "C", "easy"),
  ]
},

// ─── 4. SQL & Databases ───
{ name: "SQL & Databases", domain: "coding", tags: ["sql", "database", "backend developer", "data analyst"],
  questions: [
    mcq("Which SQL clause is used to filter rows?", "ORDER BY", "GROUP BY", "WHERE", "HAVING", "C", "easy"),
    mcq("What does INNER JOIN return?", "All rows from both tables", "Matching rows from both tables", "All rows from left table", "All rows from right table", "B", "easy"),
    mcq("Which is NOT a valid SQL aggregate function?", "COUNT", "SUM", "COLLECT", "AVG", "C", "easy"),
    text("Explain the difference between WHERE and HAVING.", "WHERE filters rows before grouping (works on individual rows). HAVING filters groups after GROUP BY (works on aggregated results). WHERE cannot use aggregate functions; HAVING can. Example: SELECT dept, COUNT(*) FROM emp WHERE salary > 50000 GROUP BY dept HAVING COUNT(*) > 5.", "medium"),
    text("What are database indexes and when should you use them?", "Indexes are data structures (typically B-trees) that speed up data retrieval. Use them on columns frequently used in WHERE, JOIN, ORDER BY clauses. Trade-off: faster reads but slower writes and more storage. Don't index columns with low cardinality or tables with heavy writes.", "medium"),
    text("Explain ACID properties of transactions.", "Atomicity: all operations succeed or all fail. Consistency: database moves from one valid state to another. Isolation: concurrent transactions don't interfere. Durability: committed data survives system failures. These ensure reliable database transactions.", "medium"),
    mcq("Which normal form eliminates transitive dependencies?", "1NF", "2NF", "3NF", "BCNF", "C", "hard"),
    text("Write a SQL query to find the second highest salary from an employees table.", "SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees); OR: SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1; OR using DENSE_RANK().", "medium"),
    mcq("What does a foreign key ensure?", "Uniqueness", "Referential integrity", "Not null values", "Primary indexing", "B", "easy"),
    text("Explain the difference between SQL and NoSQL databases.", "SQL databases are relational, use structured schemas and SQL. Good for complex queries and ACID compliance (MySQL, PostgreSQL). NoSQL databases are non-relational (document, key-value, graph, columnar). Good for flexible schemas, horizontal scaling, and high throughput (MongoDB, Redis, Cassandra).", "hard"),
  ]
},

// ─── 5. React & Frontend ───
{ name: "React & Frontend", domain: "coding", tags: ["react", "frontend developer", "web developer", "javascript"],
  questions: [
    mcq("What is JSX?", "A database", "JavaScript XML syntax extension", "A CSS framework", "A testing library", "B", "easy"),
    mcq("Which hook manages state in functional components?", "useEffect", "useRef", "useState", "useContext", "C", "easy"),
    mcq("What triggers a re-render in React?", "console.log", "State or prop change", "Variable assignment", "Function call", "B", "easy"),
    text("Explain the virtual DOM and why React uses it.", "The virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React creates a new virtual DOM, diffs it with the previous one (reconciliation), and only updates the changed parts in the real DOM. This is faster than directly manipulating the DOM because batch updates minimize expensive DOM operations.", "medium"),
    text("What is the difference between useEffect and useLayoutEffect?", "useEffect runs asynchronously after the browser paints — good for data fetching, subscriptions. useLayoutEffect runs synchronously after DOM mutations but before the browser paints — good for measuring DOM elements, preventing visual flicker. useLayoutEffect can block visual updates if slow.", "hard"),
    mcq("What does React.memo() do?", "Memoizes state", "Prevents unnecessary re-renders of a component", "Creates a ref", "Manages context", "B", "medium"),
    text("Explain prop drilling and how to solve it.", "Prop drilling is passing props through multiple component layers to reach a deeply nested component. Solutions: 1) React Context API — create a context and use useContext. 2) State management libraries like Redux, Zustand. 3) Component composition — render children directly.", "medium"),
    text("What are React Server Components?", "React Server Components (RSC) render on the server and send HTML to the client. They can directly access databases, file systems, and APIs without exposing code to the client. They reduce JavaScript bundle size. Client components (marked with 'use client') handle interactivity. Next.js App Router uses RSC by default.", "hard"),
    mcq("What does useRef return?", "A state value", "A mutable ref object with .current", "A callback function", "A context value", "B", "medium"),
    mcq("In React, keys are used in lists to:", "Style elements", "Help React identify which items changed", "Sort the list", "Filter duplicates", "B", "easy"),
  ]
},

// ─── 6. System Design ───
{ name: "System Design Basics", domain: "coding", tags: ["system design", "sde", "backend developer", "cloud architect"],
  questions: [
    text("Design a URL shortener like bit.ly.", "Components: 1) API server to accept long URLs and return short codes. 2) Database to store mappings (short code → long URL). 3) Base62 encoding or counter-based ID generation. 4) 301/302 redirect on access. 5) Cache (Redis) for hot URLs. 6) Analytics tracking. Scale: horizontal scaling with load balancer, database sharding by short code hash.", "hard"),
    text("Explain horizontal vs vertical scaling.", "Vertical scaling: adding more power (CPU, RAM) to a single server. Limited by hardware. Horizontal scaling: adding more servers. Better for high availability and fault tolerance. Horizontal is preferred for web applications — use load balancers to distribute traffic across servers.", "medium"),
    mcq("What is a load balancer?", "A database optimizer", "Distributes traffic across servers", "A caching layer", "A firewall", "B", "easy"),
    mcq("Which is NOT a caching strategy?", "Write-through", "Write-back", "Write-around", "Write-delete", "D", "medium"),
    text("What is database sharding?", "Sharding splits a database horizontally across multiple servers. Each shard holds a subset of data based on a shard key (e.g., user ID ranges). Benefits: distributes load, enables horizontal scaling. Challenges: cross-shard queries, rebalancing, maintaining consistency. Types: range-based, hash-based, directory-based.", "hard"),
    text("Explain CAP theorem.", "CAP theorem: a distributed system can guarantee at most 2 of 3 properties: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network failures). Since network partitions are inevitable, you choose between CP (consistent but may be unavailable) or AP (available but may be inconsistent).", "hard"),
    mcq("What does CDN stand for?", "Central Data Network", "Content Delivery Network", "Cloud Distribution Node", "Cached Data Namespace", "B", "easy"),
    text("What is the difference between monolithic and microservice architecture?", "Monolithic: single deployable unit, all features in one codebase. Simple but hard to scale and maintain. Microservices: independent services communicating via APIs. Each service owns its data and can be deployed independently. Better scalability and team autonomy but adds complexity (networking, monitoring, data consistency).", "medium"),
    mcq("Which protocol is commonly used for real-time communication?", "HTTP", "FTP", "WebSocket", "SMTP", "C", "medium"),
    text("How would you design a rate limiter?", "Algorithms: 1) Token bucket — tokens added at fixed rate, each request consumes a token. 2) Sliding window — count requests in a time window. 3) Leaky bucket — process requests at a constant rate. Implementation: use Redis with key=userID, value=request count and TTL for the window. Return 429 Too Many Requests when limit exceeded.", "hard"),
  ]
},

// ─── 7. Aptitude - Logical Reasoning ───
{ name: "Logical Reasoning", domain: "aptitude", tags: ["aptitude", "logical reasoning", "placement", "general"],
  questions: [
    mcq("If all dogs are animals and some animals are cats, which is true?", "All dogs are cats", "Some cats are dogs", "No conclusion about dogs and cats", "All cats are dogs", "C", "easy"),
    mcq("Complete the series: 2, 6, 12, 20, 30, ?", "40", "42", "44", "36", "B", "easy"),
    mcq("If APPLE is coded as 50, MANGO is coded as?", "55", "57", "60", "52", "C", "medium"),
    mcq("A clock shows 3:15. What is the angle between the hour and minute hands?", "0°", "7.5°", "15°", "22.5°", "B", "hard"),
    text("If 5 machines can produce 5 widgets in 5 minutes, how long would it take 100 machines to produce 100 widgets?", "5 minutes. Each machine produces 1 widget in 5 minutes. With 100 machines, each makes 1 widget in 5 minutes = 100 widgets in 5 minutes.", "medium"),
    mcq("Which number doesn't belong: 2, 3, 5, 7, 9, 11?", "2", "9", "11", "3", "B", "easy"),
    text("A boat travels 20 km upstream in 5 hours and 20 km downstream in 2 hours. Find the speed of the boat in still water and the speed of the current.", "Upstream speed = 20/5 = 4 km/h. Downstream speed = 20/2 = 10 km/h. Boat speed = (4+10)/2 = 7 km/h. Current speed = (10-4)/2 = 3 km/h.", "medium"),
    mcq("If A is B's brother, B is C's sister, C is D's father, how is A related to D?", "Father", "Uncle", "Grandfather", "Cannot be determined", "B", "hard"),
    text("There are 3 boxes. One has apples, one has oranges, one has both. All labels are wrong. You pick one fruit from the box labeled 'Both'. It's an apple. What's in each box?", "The 'Both' box actually has only apples (since labels are wrong). The 'Apples' box must have oranges or both — since 'Oranges' label is also wrong, 'Oranges' box has both, and 'Apples' box has oranges.", "hard"),
    mcq("What comes next: 1, 1, 2, 3, 5, 8, ?", "11", "12", "13", "15", "C", "easy"),
  ]
},

// ─── 8. Quantitative Aptitude ───
{ name: "Quantitative Aptitude", domain: "math", tags: ["aptitude", "math", "quantitative", "placement"],
  questions: [
    mcq("If a shirt costs ₹800 after a 20% discount, what was the original price?", "₹960", "₹1000", "₹1100", "₹900", "B", "easy"),
    mcq("Simple interest on ₹5000 at 10% per annum for 3 years is:", "₹1000", "₹1500", "₹2000", "₹500", "B", "easy"),
    text("A train 150m long passes a pole in 15 seconds. Find its speed in km/h.", "Speed = Distance/Time = 150/15 = 10 m/s. Converting to km/h: 10 × 18/5 = 36 km/h.", "easy"),
    mcq("The average of 5 numbers is 20. If one number is removed, the average becomes 15. What number was removed?", "30", "35", "40", "25", "C", "medium"),
    text("Two pipes can fill a tank in 12 and 15 hours respectively. A drain can empty it in 20 hours. How long to fill with all three open?", "Rate of pipe 1 = 1/12, pipe 2 = 1/15, drain = -1/20. Combined rate = 1/12 + 1/15 - 1/20 = 5/60 + 4/60 - 3/60 = 6/60 = 1/10. Time = 10 hours.", "medium"),
    mcq("If the ratio of A to B is 3:5 and B to C is 2:3, what is A:C?", "2:5", "3:3", "6:15", "1:5", "A", "medium"),
    text("A shopkeeper marks goods 40% above cost price and gives a 25% discount. Find the profit percentage.", "Let cost price = 100. Marked price = 140. Selling price = 140 × 0.75 = 105. Profit = 5. Profit % = 5%.", "medium"),
    mcq("What is 15% of 15% of 1000?", "22.5", "225", "2.25", "150", "A", "easy"),
    text("A and B can do a work in 12 days. B and C in 15 days. C and A in 20 days. How long for all three together?", "A+B = 1/12, B+C = 1/15, C+A = 1/20. Adding all: 2(A+B+C) = 1/12+1/15+1/20 = 5/60+4/60+3/60 = 12/60 = 1/5. So A+B+C = 1/10. Together: 10 days.", "hard"),
    mcq("Compound interest on ₹10000 at 10% for 2 years is:", "₹2000", "₹2100", "₹2200", "₹1900", "B", "medium"),
  ]
},

// ─── 9. English Grammar ───
{ name: "English Grammar", domain: "english", tags: ["english", "grammar", "communication", "placement"],
  questions: [
    mcq("Choose the correct sentence:", "He don't know nothing", "He doesn't know anything", "He don't know anything", "He doesn't know nothing", "B", "easy"),
    mcq("'She ___ to the store yesterday.'", "go", "goes", "went", "going", "C", "easy"),
    mcq("Which is the correct spelling?", "Accomodate", "Accommodate", "Acommodate", "Acomodate", "B", "easy"),
    mcq("Identify the part of speech of 'quickly' in 'She runs quickly':", "Adjective", "Noun", "Adverb", "Verb", "C", "easy"),
    text("Rewrite in passive voice: 'The chef prepared an excellent meal.'", "An excellent meal was prepared by the chef.", "medium"),
    text("Correct the errors: 'Their going to there house over they're.'", "They're going to their house over there. (They're = they are, their = possessive, there = location)", "medium"),
    mcq("Which sentence uses the subjunctive mood correctly?", "I wish I was rich", "I wish I were rich", "I wish I am rich", "I wish I be rich", "B", "hard"),
    text("Explain the difference between 'affect' and 'effect' with examples.", "Affect is usually a verb meaning 'to influence': 'The weather affects my mood.' Effect is usually a noun meaning 'result': 'The effect of the medicine was immediate.' Exception: effect as a verb means 'to bring about': 'to effect change.'", "medium"),
    mcq("'Neither the students nor the teacher ___ present.'", "are", "were", "was", "have been", "C", "medium"),
    text("Write a formal email requesting a meeting with your manager to discuss a project deadline extension.", "Subject: Request for Meeting — Project Deadline Extension\n\nDear [Manager's Name],\n\nI am writing to request a brief meeting to discuss the timeline for the [Project Name]. Due to [specific reason], I believe an extension would help ensure the quality of our deliverables.\n\nWould you be available [suggest time]? I am happy to adjust to your schedule.\n\nThank you for your consideration.\n\nBest regards,\n[Your Name]", "medium", "Write a professional, concise email."),
  ]
},

// ─── 10. English Comprehension ───
{ name: "English Comprehension", domain: "english", tags: ["english", "reading", "comprehension", "content writer"],
  questions: [
    text("Read: 'The Industrial Revolution transformed manufacturing from hand production to machines, beginning in Britain around 1760.' What was the main change brought by the Industrial Revolution?", "The main change was the transformation from hand production methods to machine-based manufacturing.", "easy"),
    mcq("'Ubiquitous' most nearly means:", "Rare", "Present everywhere", "Invisible", "Temporary", "B", "medium"),
    mcq("'Ephemeral' is the opposite of:", "Temporary", "Fleeting", "Permanent", "Brief", "C", "medium"),
    text("Summarize in 2-3 sentences: 'Climate change refers to long-term shifts in temperatures and weather patterns. Human activities have been the main driver since the 1800s, primarily due to burning fossil fuels like coal, oil and gas. This produces heat-trapping gases.'", "Climate change involves long-term temperature and weather shifts caused mainly by human activities since the 1800s. Burning fossil fuels produces greenhouse gases that trap heat in the atmosphere.", "easy"),
    mcq("In formal writing, which transition word shows contrast?", "Furthermore", "However", "Moreover", "Additionally", "B", "easy"),
    text("What is the tone of: 'Despite numerous setbacks, the team persevered, demonstrating remarkable resilience.'?", "The tone is admiring/inspirational. Words like 'persevered' and 'remarkable resilience' convey respect and admiration for the team's determination.", "medium"),
    mcq("'The CEO's decision was pragmatic.' Pragmatic means:", "Impractical", "Emotional", "Practical and realistic", "Theoretical", "C", "medium"),
    text("Identify the thesis statement: 'Many argue social media is harmful. Others see benefits. However, research shows that excessive social media use correlates with increased anxiety, making it a public health concern.'", "The thesis is: 'excessive social media use correlates with increased anxiety, making it a public health concern.' This is the author's main argument.", "medium"),
    mcq("What is an antonym of 'benevolent'?", "Kind", "Generous", "Malevolent", "Charitable", "C", "easy"),
    text("Paraphrase: 'The government implemented stringent measures to curb the spread of misinformation online.'", "The government introduced strict policies to reduce the spread of false information on the internet.", "easy"),
  ]
},

// ─── 11. HR & Behavioral ───
{ name: "HR & Behavioral Questions", domain: "hr", tags: ["hr", "behavioral", "interview", "management trainee", "hr manager"],
  questions: [
    text("Tell me about yourself.", "I am a [role] with [X years] experience in [field]. I have worked on [key achievements]. I'm passionate about [interest] and looking forward to contributing to [company/role]. My strengths include [2-3 strengths]. (Structure: Present → Past → Future)", "easy", "Use the Present-Past-Future structure."),
    text("Describe a time you handled a conflict at work.", "Situation: A disagreement with a team member about project approach. Task: Resolve the conflict without affecting the project timeline. Action: I scheduled a private meeting, listened to their perspective, and proposed a compromise combining both approaches. Result: We met the deadline, and the combined approach was actually better than either individual one.", "medium", "Use the STAR method (Situation, Task, Action, Result)."),
    text("What is your biggest weakness?", "I tend to be overly detail-oriented, sometimes spending too much time perfecting smaller tasks. I've been working on this by setting time limits for tasks and prioritizing based on impact. I now use the 80/20 rule — focusing on the 20% of work that creates 80% of value.", "medium"),
    text("Why should we hire you?", "I bring a unique combination of [technical skills] and [soft skills] relevant to this role. My experience with [specific experience] directly aligns with [job requirement]. I'm a fast learner, team player, and committed to delivering results. I'm genuinely excited about [company's mission/product].", "medium"),
    text("Where do you see yourself in 5 years?", "In 5 years, I see myself having grown into a senior role where I can both contribute technically and mentor junior team members. I want to have deepened my expertise in [relevant field] and contributed to significant projects that create impact.", "easy"),
    text("Describe a time you showed leadership.", "Situation: Our team lead was on leave during a critical sprint. Task: Someone needed to coordinate the team. Action: I volunteered to organize daily standups, prioritized tasks, and helped remove blockers for team members. Result: We delivered on time, and my manager noted my initiative in my next review.", "medium", "Use STAR method."),
    text("How do you handle pressure and tight deadlines?", "I prioritize tasks by urgency and impact, break large tasks into smaller milestones, and communicate proactively about progress. Under pressure, I stay focused on what I can control and ask for help when needed. Example: [specific situation where you delivered under pressure].", "medium"),
    text("Tell me about a time you failed.", "Situation: I underestimated the complexity of a database migration. Task: Complete migration within the sprint. Action: I didn't ask for help early enough and tried to handle everything alone. Result: We missed the deadline by 2 days. Lesson: I learned to raise flags early, break tasks down better, and leverage team expertise.", "hard", "Be honest and focus on what you learned."),
    text("What motivates you?", "I'm motivated by solving challenging problems, learning new technologies, and seeing the direct impact of my work on users. I also value working with a collaborative team where we push each other to grow. Recognition for good work and opportunities for growth keep me engaged.", "easy"),
    text("Do you have any questions for us?", "Good questions to ask: 1) What does a typical day look like for this role? 2) What are the biggest challenges the team faces right now? 3) How is success measured in this position? 4) What opportunities for growth and learning does the company provide? 5) What's the team culture like?", "easy"),
  ]
},

// ─── 12. Situational Judgment ───
{ name: "Situational Judgment", domain: "situational", tags: ["situational", "judgment", "management", "consultant", "operations manager"],
  questions: [
    text("Your team member consistently misses deadlines. What do you do?", "1) Have a private, empathetic conversation to understand the root cause (workload, personal issues, unclear requirements). 2) Set clear expectations and agree on realistic deadlines together. 3) Offer support (training, mentoring, workload redistribution). 4) Document agreements and follow up regularly. 5) If issues persist, escalate to manager while being fair.", "medium"),
    text("You discover a critical bug in production on a Friday evening. What's your approach?", "1) Assess severity and user impact immediately. 2) If critical (data loss, security), fix it now — alert the on-call team. 3) If non-critical, document it, create a hotfix plan, and communicate timeline to stakeholders. 4) Apply a quick patch if possible, with a proper fix scheduled for next week. 5) Do a post-mortem to prevent recurrence.", "medium"),
    text("A client demands a feature that's technically impossible within their budget. How do you respond?", "1) Listen and understand the business need behind the request. 2) Explain the technical constraints honestly but respectfully. 3) Propose alternative solutions that achieve their goal within budget. 4) Provide options with trade-offs (reduced scope, phased delivery, increased budget). 5) Document the agreed approach.", "hard"),
    text("Two team members have a personal conflict affecting work. As their manager, what do you do?", "1) Meet each person individually to understand their perspective. 2) Bring them together for a facilitated discussion focused on work, not personalities. 3) Establish ground rules for professional behavior. 4) Assign clear roles to reduce overlap/conflict points. 5) Follow up regularly and involve HR if the situation doesn't improve.", "hard"),
    mcq("Your manager asks you to do something unethical. Best response?", "Do it to keep your job", "Refuse and report to HR/compliance", "Ignore the request", "Complain to coworkers", "B", "easy"),
    text("You're leading a project and realize the original estimate was way off. You need 3 more weeks. What do you do?", "1) Don't hide it — immediately inform stakeholders. 2) Present a revised timeline with clear reasons for the delay. 3) Show what's been accomplished and what remains. 4) Propose ways to mitigate (reduce scope, add resources, parallel work). 5) Get buy-in on the new plan and commit to it.", "medium"),
    text("A new team member is struggling to adapt. How do you help?", "1) Assign a buddy/mentor from the team. 2) Schedule regular check-ins (not micromanaging). 3) Provide clear documentation and resources. 4) Give small, achievable tasks to build confidence. 5) Be patient — acknowledge the learning curve openly. 6) Create a safe space for questions.", "easy"),
    mcq("Your project is behind schedule. What's the FIRST thing you should do?", "Work overtime immediately", "Identify the root cause of delays", "Blame the team", "Ask for a deadline extension", "B", "easy"),
    text("You receive negative feedback from a senior colleague in front of the team. How do you react?", "1) Stay calm and professional — don't react emotionally. 2) Thank them for the feedback. 3) If valid, acknowledge it and commit to improving. 4) After the meeting, speak privately to express that you'd prefer feedback in private. 5) Reflect on the feedback objectively and take actionable steps.", "medium"),
    text("You're offered a promotion but it means relocating. Your family doesn't want to move. What factors do you consider?", "Consider: career growth opportunity, family well-being, financial impact, possibility of remote work, timeline for relocation, alternative roles, partner's career, children's education, cost of living difference. Discuss openly with family, negotiate with employer (delayed relocation, hybrid arrangement), and weigh long-term career vs personal priorities.", "hard"),
  ]
},

// ─── 13. Communication Skills ───
{ name: "Communication Skills", domain: "communication", tags: ["communication", "soft skills", "marketing manager", "corporate trainer"],
  questions: [
    text("Write a professional LinkedIn summary for a software developer.", "Results-driven software developer with 3+ years of experience building scalable web applications using React, Node.js, and Python. Passionate about clean code, user experience, and solving complex problems. Currently at [Company], where I've led the development of [project] serving 50K+ users. Always learning — currently exploring cloud architecture and system design. Open to connecting with fellow developers and tech leaders.", "medium"),
    text("Explain cloud computing to a non-technical person.", "Cloud computing is like renting a computer over the internet instead of buying one. Instead of storing files on your own hard drive, you store them on powerful computers owned by companies like Google or Amazon. You can access your files from anywhere, and you only pay for what you use — like electricity. Netflix, Google Drive, and online banking all use cloud computing.", "medium"),
    text("Write a persuasive paragraph about why companies should adopt remote work.", "Remote work isn't just a perk — it's a competitive advantage. Companies that offer remote work access a global talent pool, reduce office costs by up to 30%, and see productivity increases of 13-25%. Employees report higher job satisfaction and better work-life balance, leading to lower turnover. In a post-pandemic world, companies that don't adapt risk losing top talent to competitors that do.", "medium"),
    mcq("In professional communication, 'per your request' is an example of:", "Slang", "Formal register", "Informal register", "Technical jargon", "B", "easy"),
    text("How would you deliver bad news to a client about a project delay?", "Be direct but empathetic. Lead with the impact, then the cause, then the solution. Example: 'I want to give you an honest update. We've encountered [issue] which will delay delivery by [time]. Here's our plan to minimize impact: [solution]. I take responsibility for the timeline and am committed to [revised deadline].'", "hard"),
    mcq("Active listening involves:", "Waiting for your turn to speak", "Making eye contact, nodding, and paraphrasing", "Giving advice immediately", "Multitasking while listening", "B", "easy"),
    text("Write a 1-minute elevator pitch for a food delivery startup.", "Did you know 40% of people skip meals because they can't find healthy options nearby? We're FreshPlate — an app that connects you with local home chefs who prepare fresh, healthy meals daily. Unlike other delivery apps, every meal is made that day with local ingredients. We've grown to 5,000 users in 3 months with a 4.8 rating. We're raising our seed round to expand to 5 cities. Would you like to learn more?", "hard"),
    text("Explain the importance of non-verbal communication.", "Non-verbal communication (body language, facial expressions, tone, gestures, posture) accounts for 55-93% of communication impact. Maintaining eye contact shows confidence. Open posture signals receptiveness. Mismatched verbal and non-verbal signals cause distrust. In interviews and presentations, non-verbal cues often matter more than words.", "medium"),
    mcq("Which is the most effective email subject line?", "Hello", "Quick question about the Q3 budget report", "URGENT!!!", "FYI", "B", "easy"),
    text("Write an apology email to a customer who received a damaged product.", "Subject: Sincere Apology — Damaged Product Replacement\n\nDear [Customer],\n\nI'm truly sorry to hear that your order arrived damaged. This is not the experience we want for our customers.\n\nWe've already shipped a replacement via express delivery (tracking: [number]) at no cost. You don't need to return the damaged item.\n\nAs a gesture of apology, please find a 20% discount code for your next purchase: [CODE].\n\nThank you for your patience.\n\nWarm regards,\n[Name]", "medium"),
  ]
},

// ─── 14. Java Programming ───
{ name: "Java Programming", domain: "coding", tags: ["java", "java developer", "sde", "backend developer"],
  questions: [
    mcq("Java is:", "Compiled only", "Interpreted only", "Both compiled and interpreted", "Neither", "C", "easy"),
    mcq("Which keyword prevents method overriding?", "static", "final", "abstract", "volatile", "B", "easy"),
    mcq("What is the default value of an int in Java?", "null", "0", "1", "-1", "B", "easy"),
    text("Explain the difference between abstract class and interface in Java.", "Abstract class: can have both abstract and concrete methods, instance variables, constructors. Single inheritance. Interface: only abstract methods (before Java 8), constants. Multiple implementation. After Java 8, interfaces can have default and static methods. Use abstract class for 'is-a' relationship, interface for 'can-do' capabilities.", "medium"),
    text("What is the Java Memory Model? Explain heap vs stack.", "Stack: stores method calls, local variables, references. Each thread has its own stack. LIFO. Fast access. Heap: stores objects and instance variables. Shared across threads. Managed by garbage collector. Slower access. String pool is in the heap. Stack overflow = too many method calls. OutOfMemoryError = heap is full.", "hard"),
    code("Write a Java program to check if a number is prime.", "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        int n = new Scanner(System.in).nextInt();\n        if (n < 2) { System.out.println(\"No\"); return; }\n        for (int i = 2; i * i <= n; i++)\n            if (n % i == 0) { System.out.println(\"No\"); return; }\n        System.out.println(\"Yes\");\n    }\n}", [
      { input: "7", expectedOutput: "Yes" }, { input: "10", expectedOutput: "No" }, { input: "1", expectedOutput: "No" }
    ], "easy"),
    mcq("Which collection doesn't allow duplicates?", "ArrayList", "LinkedList", "HashSet", "Vector", "C", "easy"),
    text("Explain garbage collection in Java.", "Garbage collection automatically frees memory by removing objects that are no longer referenced. The JVM's GC runs periodically. Generations: Young (Eden, Survivor), Old, PermGen/Metaspace. Minor GC cleans Young gen; Major GC cleans Old gen. Algorithms: Serial, Parallel, CMS, G1, ZGC. You can suggest GC with System.gc() but can't force it.", "hard"),
    code("Write a program to find the longest common prefix among space-separated strings.", "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        String[] words = new Scanner(System.in).nextLine().split(\" \");\n        String prefix = words[0];\n        for (int i = 1; i < words.length; i++) {\n            while (!words[i].startsWith(prefix)) prefix = prefix.substring(0, prefix.length()-1);\n            if (prefix.isEmpty()) break;\n        }\n        System.out.println(prefix.isEmpty() ? \"NONE\" : prefix);\n    }\n}", [
      { input: "flower flow flight", expectedOutput: "fl" }, { input: "dog racecar car", expectedOutput: "NONE" }
    ], "medium"),
    mcq("What does 'synchronized' keyword do?", "Makes a method static", "Ensures thread-safe access", "Prevents inheritance", "Optimizes performance", "B", "medium"),
  ]
},

// ─── 15. C++ Programming ───
{ name: "C++ Programming", domain: "coding", tags: ["cpp", "c++", "sde", "competitive programming"],
  questions: [
    mcq("What is the size of int in C++ (typically)?", "2 bytes", "4 bytes", "8 bytes", "Depends on compiler", "B", "easy"),
    mcq("Which operator is used for dynamic memory allocation in C++?", "malloc", "alloc", "new", "create", "C", "easy"),
    mcq("What is a virtual function?", "A function with no body", "A function that can be overridden in derived class", "A static function", "A private function", "B", "medium"),
    text("Explain the difference between pointers and references in C++.", "Pointers: hold memory addresses, can be null, can be reassigned, need dereferencing (*), support pointer arithmetic. References: aliases for existing variables, cannot be null, must be initialized, cannot be reassigned, no special syntax to access value. References are safer; pointers are more flexible.", "medium"),
    text("What is RAII in C++?", "Resource Acquisition Is Initialization — a design pattern where resources (memory, file handles, locks) are acquired in a constructor and released in the destructor. This ensures cleanup even during exceptions. Smart pointers (unique_ptr, shared_ptr) implement RAII for dynamic memory.", "hard"),
    code("Write a program to find the GCD of two numbers.", "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    cin >> a >> b;\n    while (b) { int t = b; b = a % b; a = t; }\n    cout << a << endl;\n    return 0;\n}", [
      { input: "12 8", expectedOutput: "4" }, { input: "100 75", expectedOutput: "25" }, { input: "7 3", expectedOutput: "1" }
    ], "easy"),
    code("Write a program to check if a given string is an anagram of another. Input: two strings on separate lines.", "#include <iostream>\n#include <algorithm>\n#include <string>\nusing namespace std;\nint main() {\n    string a, b;\n    getline(cin, a);\n    getline(cin, b);\n    sort(a.begin(), a.end());\n    sort(b.begin(), b.end());\n    cout << (a == b ? \"Yes\" : \"No\") << endl;\n    return 0;\n}", [
      { input: "listen\nsilent", expectedOutput: "Yes" }, { input: "hello\nworld", expectedOutput: "No" }
    ], "medium"),
    mcq("What is the output of sizeof('a') in C++?", "1", "2", "4", "8", "A", "medium"),
    text("Explain move semantics in C++11.", "Move semantics allow transferring resources from one object to another without copying. Uses rvalue references (&&). Instead of deep copying, the 'move constructor' steals the source's resources and leaves it in a valid but empty state. Significantly improves performance for large objects (vectors, strings). std::move() casts an lvalue to rvalue.", "hard"),
    mcq("Which STL container provides O(1) average lookup?", "vector", "list", "unordered_map", "map", "C", "medium"),
  ]
},

// ─── 16. Machine Learning Basics ───
{ name: "Machine Learning Basics", domain: "coding", tags: ["machine learning", "data scientist", "ai engineer", "python"],
  questions: [
    mcq("Which is a supervised learning algorithm?", "K-Means", "PCA", "Linear Regression", "DBSCAN", "C", "easy"),
    mcq("What does overfitting mean?", "Model performs well on all data", "Model memorizes training data but fails on new data", "Model is too simple", "Model has too few features", "B", "easy"),
    mcq("Which metric is best for imbalanced classification?", "Accuracy", "F1-Score", "Mean Squared Error", "R-squared", "B", "medium"),
    text("Explain the bias-variance tradeoff.", "Bias: error from oversimplified model (underfitting). High bias = misses patterns. Variance: error from oversensitivity to training data (overfitting). High variance = captures noise. The goal is to find the sweet spot — complex enough to capture patterns, simple enough to generalize. Techniques: cross-validation, regularization, ensemble methods.", "hard"),
    text("What is gradient descent?", "Gradient descent is an optimization algorithm that iteratively adjusts model parameters to minimize a loss function. It calculates the gradient (slope) of the loss with respect to each parameter and updates parameters in the opposite direction. Learning rate controls step size. Variants: batch, stochastic (SGD), mini-batch. Can get stuck in local minima.", "medium"),
    mcq("Random Forest is an ensemble of:", "Neural networks", "SVMs", "Decision trees", "Linear models", "C", "easy"),
    text("Explain the difference between classification and regression.", "Classification predicts discrete categories/labels (spam/not spam, cat/dog). Uses algorithms like logistic regression, SVM, decision trees. Metrics: accuracy, precision, recall, F1. Regression predicts continuous numerical values (price, temperature). Uses linear regression, polynomial regression. Metrics: MSE, RMSE, R-squared.", "easy"),
    text("What is cross-validation and why is it important?", "Cross-validation splits data into k folds, trains on k-1 folds and validates on the remaining fold, rotating k times. It provides a more reliable estimate of model performance than a single train/test split. Reduces overfitting risk and helps in model selection. K=5 or K=10 are common choices.", "medium"),
    mcq("Which is NOT a type of neural network?", "CNN", "RNN", "GAN", "KNN", "D", "medium"),
    text("Explain L1 vs L2 regularization.", "L1 (Lasso): adds absolute value of weights as penalty. Produces sparse models (some weights become exactly 0). Good for feature selection. L2 (Ridge): adds squared weights as penalty. Shrinks weights toward 0 but doesn't eliminate them. Better when all features are relevant. Elastic Net combines both.", "hard"),
  ]
},

// ─── 17. Cloud & DevOps ───
{ name: "Cloud & DevOps", domain: "coding", tags: ["devops", "cloud", "aws", "docker", "devops engineer", "cloud engineer"],
  questions: [
    mcq("What does CI/CD stand for?", "Code Integration/Code Delivery", "Continuous Integration/Continuous Deployment", "Central Integration/Central Delivery", "Cloud Integration/Cloud Deployment", "B", "easy"),
    mcq("Docker containers are:", "Full virtual machines", "Lightweight isolated processes", "Physical servers", "Database instances", "B", "easy"),
    mcq("Which AWS service is for object storage?", "EC2", "RDS", "S3", "Lambda", "C", "easy"),
    text("Explain the difference between Docker and Kubernetes.", "Docker: containerization platform — packages apps with dependencies into portable containers. Kubernetes: container orchestration — manages, scales, and deploys containers across clusters. Docker builds and runs single containers; Kubernetes manages hundreds of containers, handles load balancing, auto-scaling, self-healing, and rolling updates.", "medium"),
    text("What is Infrastructure as Code (IaC)?", "IaC manages infrastructure through code/configuration files instead of manual setup. Tools: Terraform, CloudFormation, Pulumi. Benefits: version control, reproducibility, automation, consistency across environments. You define desired infrastructure state; the tool creates/modifies resources to match. Follows DevOps principles of automation.", "medium"),
    text("Explain the 12-Factor App methodology (key points).", "12-Factor App is a methodology for building SaaS apps: 1) Codebase in version control. 2) Dependencies explicitly declared. 3) Config in environment variables. 4) Backing services as attached resources. 5) Build/release/run stages separated. 6) Stateless processes. 7) Port binding. 8) Concurrency via processes. 9) Disposability. 10) Dev/prod parity. 11) Logs as event streams. 12) Admin processes as one-off tasks.", "hard"),
    mcq("What is a Kubernetes Pod?", "A cluster", "Smallest deployable unit (1+ containers)", "A namespace", "A service mesh", "B", "medium"),
    text("What is the difference between blue-green and canary deployments?", "Blue-green: run two identical environments (blue=current, green=new). Switch traffic all at once when green is ready. Easy rollback by switching back. Canary: gradually route a small percentage of traffic to the new version, monitor, then increase. Less risk — if issues arise, only a small % of users are affected.", "hard"),
    mcq("Which is a serverless compute service on AWS?", "EC2", "ECS", "Lambda", "EKS", "C", "easy"),
    text("Explain what a reverse proxy is and give an example.", "A reverse proxy sits between clients and backend servers, forwarding client requests to the appropriate server. Benefits: load balancing, SSL termination, caching, security (hides backend). Examples: Nginx, HAProxy, AWS ALB. Unlike a forward proxy (client-side), a reverse proxy is server-side and clients don't know they're talking to a proxy.", "medium"),
  ]
},

// ─── 18. Networking Basics ───
{ name: "Networking Basics", domain: "aptitude", tags: ["networking", "it support", "cybersecurity", "cloud engineer"],
  questions: [
    mcq("What does HTTP stand for?", "HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Process", "Host Text Transfer Protocol", "A", "easy"),
    mcq("Which port does HTTPS use by default?", "80", "443", "8080", "3000", "B", "easy"),
    mcq("What layer does TCP operate on in the OSI model?", "Network", "Data Link", "Transport", "Application", "C", "medium"),
    text("Explain the difference between TCP and UDP.", "TCP: connection-oriented, reliable, ordered delivery, flow control, error checking. Used for web, email, file transfer. Slower due to overhead. UDP: connectionless, unreliable, no ordering guarantee, no flow control. Used for streaming, gaming, DNS. Faster due to minimal overhead.", "medium"),
    text("What is DNS and how does it work?", "DNS (Domain Name System) translates domain names to IP addresses. Flow: 1) Browser checks cache. 2) Queries recursive DNS resolver. 3) Resolver checks root server → TLD server (.com) → authoritative nameserver. 4) Returns IP address. 5) Browser connects to IP. DNS uses port 53, primarily UDP.", "medium"),
    mcq("What is a subnet mask used for?", "Encrypting data", "Dividing a network into sub-networks", "Routing emails", "Compressing files", "B", "easy"),
    text("Explain what a VPN is and how it works.", "VPN (Virtual Private Network) creates an encrypted tunnel between your device and a VPN server. All traffic is routed through this tunnel, hiding your IP and encrypting data. Uses: privacy, accessing geo-restricted content, secure remote work. Protocols: OpenVPN, WireGuard, IPSec. The VPN server's IP appears as your public IP.", "medium"),
    mcq("Which protocol is used to send emails?", "POP3", "IMAP", "SMTP", "FTP", "C", "easy"),
    text("What is the three-way handshake in TCP?", "1) SYN: Client sends a SYN (synchronize) packet to server. 2) SYN-ACK: Server responds with SYN-ACK (synchronize-acknowledge). 3) ACK: Client sends ACK (acknowledge). Connection is now established. This ensures both sides are ready to communicate and agree on sequence numbers.", "medium"),
    mcq("What does NAT stand for?", "Network Address Translation", "Network Access Terminal", "Node Assignment Table", "Network Authentication Token", "A", "medium"),
  ]
},

// ─── 19. Financial Aptitude ───
{ name: "Financial Aptitude", domain: "math", tags: ["finance", "accountant", "financial analyst", "math"],
  questions: [
    mcq("What is the formula for compound interest?", "P × R × T / 100", "P(1 + R/100)^T - P", "P × R × T", "P + R + T", "B", "easy"),
    mcq("Which financial statement shows a company's profitability?", "Balance Sheet", "Income Statement", "Cash Flow Statement", "Statement of Equity", "B", "easy"),
    text("Explain the difference between assets and liabilities.", "Assets are what a company owns — resources that provide future economic benefit (cash, inventory, equipment, property). Liabilities are what a company owes — obligations to pay (loans, accounts payable, bonds). The accounting equation: Assets = Liabilities + Equity.", "easy"),
    text("What is the time value of money?", "The time value of money (TVM) means money today is worth more than the same amount in the future because of its earning potential. ₹1000 today can earn interest and become ₹1100 in a year. This concept underlies present value, future value, discounting, and investment decisions. Formula: FV = PV × (1 + r)^n.", "medium"),
    mcq("Current ratio is calculated as:", "Current Assets / Total Assets", "Current Assets / Current Liabilities", "Total Liabilities / Total Assets", "Net Income / Revenue", "B", "easy"),
    text("A company has revenue of ₹10 lakhs, COGS of ₹4 lakhs, and operating expenses of ₹3 lakhs. Calculate the operating profit and operating margin.", "Operating Profit = Revenue - COGS - Operating Expenses = 10 - 4 - 3 = ₹3 lakhs. Operating Margin = Operating Profit / Revenue = 3/10 = 30%.", "medium"),
    text("Explain what GST is and its types in India.", "GST (Goods and Services Tax) is an indirect tax replacing multiple taxes. Types: CGST (Central) + SGST (State) for intra-state sales. IGST (Integrated) for inter-state sales. Slabs: 0%, 5%, 12%, 18%, 28%. Input tax credit allows offsetting tax paid on inputs against output tax liability.", "medium"),
    mcq("What does ROI stand for?", "Rate of Investment", "Return on Investment", "Revenue over Income", "Risk of Inflation", "B", "easy"),
    text("If you invest ₹50,000 at 8% compound interest annually, what will be the amount after 3 years?", "A = P(1 + r)^n = 50000 × (1.08)^3 = 50000 × 1.259712 = ₹62,985.60", "medium"),
    mcq("Depreciation is:", "An increase in asset value", "A decrease in asset value over time", "A tax on assets", "Interest on loans", "B", "easy"),
  ]
},

// ─── 20. Marketing & SEO ───
{ name: "Marketing & Digital", domain: "communication", tags: ["marketing", "seo", "social media manager", "marketing manager"],
  questions: [
    mcq("What does SEO stand for?", "Social Engine Optimization", "Search Engine Optimization", "System Engineering Output", "Structured Email Outreach", "B", "easy"),
    mcq("Which metric measures the percentage of visitors who leave after viewing one page?", "Click-through rate", "Bounce rate", "Conversion rate", "Engagement rate", "B", "easy"),
    text("Explain the difference between organic and paid marketing.", "Organic marketing uses free channels (SEO, social media posts, content marketing, email newsletters) — slower but builds long-term credibility. Paid marketing uses ads (Google Ads, Facebook Ads, sponsored content) — immediate results but costs money per click/impression. Best strategy combines both.", "medium"),
    text("What is a marketing funnel? Describe its stages.", "A marketing funnel represents the customer journey: 1) Awareness — customer discovers your brand (ads, content, social). 2) Interest — engages with content (reads blog, follows social). 3) Consideration — evaluates your product vs alternatives. 4) Intent — shows purchase intent (adds to cart). 5) Purchase — buys. 6) Loyalty — repeat customer, referrals.", "medium"),
    mcq("What is a CTA in marketing?", "Customer Targeting Algorithm", "Call to Action", "Click Through Analytics", "Content Translation App", "B", "easy"),
    text("Write a compelling product description for wireless earbuds.", "Experience sound without limits. Our AirPods Pro feature active noise cancellation that blocks out the world, 30-hour battery life, and crystal-clear audio with deep bass. IPX5 waterproof — perfect for workouts. Seamless pairing with all devices. Ultra-lightweight at just 5g per earbud. Premium sound. Effortless comfort. Your music, unleashed.", "medium"),
    text("What is A/B testing and why is it important?", "A/B testing compares two versions of a webpage, email, or ad to see which performs better. Show version A to 50% of users and version B to 50%. Measure the metric you care about (conversion rate, click rate). Important because it removes guesswork — decisions are based on data, not opinions. Test one variable at a time.", "medium"),
    mcq("Which social media platform is best for B2B marketing?", "TikTok", "Instagram", "LinkedIn", "Snapchat", "C", "easy"),
    text("Explain what content marketing is with examples.", "Content marketing creates valuable, relevant content to attract and retain an audience. Instead of directly selling, it educates and builds trust. Examples: blog posts (HubSpot), YouTube tutorials (Google), podcasts (Spotify), infographics, ebooks, case studies. Goal: establish authority, drive organic traffic, nurture leads through the funnel.", "medium"),
    text("What are the key metrics to track for a social media campaign?", "1) Reach/Impressions — how many saw it. 2) Engagement rate — likes, comments, shares / reach. 3) Click-through rate (CTR) — clicks on links. 4) Conversion rate — desired actions taken. 5) Follower growth. 6) Cost per click/acquisition (for paid). 7) Sentiment analysis. 8) ROI — revenue generated vs spend.", "medium"),
  ]
},

// ─── 21-50: More folders ───

// 21
{ name: "OOP Concepts", domain: "coding", tags: ["oop", "object oriented", "sde", "java developer"],
  questions: [
    mcq("Which is NOT an OOP principle?", "Encapsulation", "Compilation", "Inheritance", "Polymorphism", "B", "easy"),
    mcq("What is polymorphism?", "Hiding data", "One interface, multiple implementations", "Single inheritance", "Code duplication", "B", "easy"),
    text("Explain encapsulation with an example.", "Encapsulation bundles data and methods that operate on it within a class, hiding internal state. Example: A BankAccount class with private balance, public deposit() and withdraw() methods. External code can't directly modify balance — must use methods that enforce rules (no negative balance).", "medium"),
    text("What is the difference between method overloading and overriding?", "Overloading: same method name, different parameters in the same class. Compile-time polymorphism. Overriding: same method name and parameters in a subclass. Runtime polymorphism. Overloading = static dispatch; overriding = dynamic dispatch via virtual method table.", "medium"),
    mcq("Abstract class vs Interface: which allows constructors?", "Only Interface", "Only Abstract Class", "Both", "Neither", "B", "medium"),
    text("Explain SOLID principles briefly.", "S: Single Responsibility — one class, one job. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subtypes must be substitutable for base types. I: Interface Segregation — prefer small, specific interfaces. D: Dependency Inversion — depend on abstractions, not concretions.", "hard"),
    mcq("Multiple inheritance is directly supported in:", "Java", "C++", "C#", "TypeScript", "B", "medium"),
    text("What is the diamond problem in OOP?", "The diamond problem occurs in multiple inheritance when a class inherits from two classes that both inherit from a common base. It creates ambiguity about which version of the base class's methods to use. C++ solves it with virtual inheritance. Java avoids it by not allowing multiple class inheritance (only multiple interface implementation).", "hard"),
    mcq("A constructor:", "Returns a value", "Is called when an object is created", "Must be static", "Cannot be overloaded", "B", "easy"),
    text("What is dependency injection?", "Dependency injection is a design pattern where an object's dependencies are provided externally rather than created internally. Types: constructor injection, setter injection, interface injection. Benefits: loose coupling, easier testing (mock dependencies), follows Dependency Inversion Principle. Frameworks: Spring (Java), Angular (TypeScript).", "hard"),
  ]
},

// 22
{ name: "Git & Version Control", domain: "coding", tags: ["git", "version control", "sde", "devops"],
  questions: [
    mcq("What does 'git pull' do?", "Pushes changes", "Fetches and merges remote changes", "Creates a branch", "Deletes a branch", "B", "easy"),
    mcq("Which command creates a new branch?", "git new", "git branch <name>", "git create", "git init", "B", "easy"),
    text("Explain the difference between git merge and git rebase.", "Merge creates a merge commit combining two branches — preserves history but can be messy. Rebase replays commits on top of another branch — creates linear history but rewrites commit hashes. Use merge for shared branches; rebase for cleaning up local feature branches before merging.", "medium"),
    text("What is a git conflict and how do you resolve it?", "A conflict occurs when two branches modify the same line in a file. Git marks conflicts with <<<< ==== >>>> markers. Resolution: 1) Open the conflicted file. 2) Choose which changes to keep. 3) Remove conflict markers. 4) Stage the resolved file. 5) Commit.", "medium"),
    mcq("'git stash' is used to:", "Delete changes", "Temporarily save uncommitted changes", "Create a branch", "Push to remote", "B", "easy"),
    text("Explain git cherry-pick.", "Cherry-pick applies a specific commit from one branch to another without merging the entire branch. Command: git cherry-pick <commit-hash>. Useful for: applying a bugfix from develop to main without merging all of develop, or backporting features. It creates a new commit with the same changes.", "medium"),
    mcq("What is HEAD in git?", "The latest remote commit", "A pointer to the current commit", "The main branch", "The first commit", "B", "medium"),
    text("What is .gitignore and why is it important?", ".gitignore specifies files/directories that git should not track. Important to exclude: node_modules/, .env files (secrets), build artifacts, IDE settings, OS files (.DS_Store). Prevents committing sensitive data and unnecessary files. Patterns: *.log, /dist, !important.log (negate).", "easy"),
    mcq("What does 'git reset --hard HEAD~1' do?", "Creates a commit", "Undoes the last commit and discards changes", "Merges branches", "Pushes to remote", "B", "hard"),
    text("Explain the difference between git fetch and git pull.", "git fetch downloads new data from remote but doesn't integrate it — safe to inspect changes first. git pull = git fetch + git merge — downloads and immediately integrates. fetch is safer; pull is convenient. Use fetch when you want to review changes before merging.", "easy"),
  ]
},

// 23-50: Remaining folders with concise questions
// I'll add the remaining 28 folders more concisely

// 23
{ name: "API Design & REST", domain: "coding", tags: ["api", "rest", "backend developer", "web developer"],
  questions: [
    mcq("REST stands for:", "Remote Execution Standard Transfer", "Representational State Transfer", "Real-time Event Streaming Technology", "Request-Execute-Send-Transfer", "B", "easy"),
    mcq("Which HTTP method is idempotent?", "POST", "PATCH", "GET", "None", "C", "easy"),
    mcq("HTTP 404 means:", "Server error", "Unauthorized", "Not found", "Bad request", "C", "easy"),
    text("Explain the difference between PUT and PATCH.", "PUT replaces the entire resource with the request body. PATCH partially updates the resource with only the changed fields. PUT is idempotent; PATCH may or may not be. Example: updating a user's email — PUT sends all user fields, PATCH sends only {email: 'new@email.com'}.", "medium"),
    text("What is REST API versioning and why is it important?", "API versioning allows updating APIs without breaking existing clients. Methods: URL path (/api/v1/users), query param (?version=1), header (Accept: application/vnd.api.v1+json). Important for backward compatibility when changing response formats, removing fields, or changing behavior.", "medium"),
    mcq("Which status code indicates successful creation?", "200", "201", "204", "301", "B", "easy"),
    text("What is rate limiting and why do APIs need it?", "Rate limiting restricts the number of API requests a client can make in a time period. Prevents abuse, DDoS attacks, and ensures fair usage. Common: 100 requests/minute per API key. Implementations: token bucket, sliding window. Returns 429 Too Many Requests when exceeded.", "medium"),
    text("Explain JWT authentication.", "JWT (JSON Web Token) is a stateless authentication method. Flow: 1) User logs in with credentials. 2) Server creates a JWT containing user ID and claims, signed with a secret. 3) Client stores JWT (usually in localStorage or httpOnly cookie). 4) Client sends JWT in Authorization header for subsequent requests. 5) Server verifies signature and extracts user info.", "medium"),
    mcq("GraphQL was developed by:", "Google", "Microsoft", "Facebook/Meta", "Amazon", "C", "medium"),
    text("What is CORS and why is it needed?", "CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web pages from making requests to a different domain than the one serving the page. Servers must include Access-Control-Allow-Origin headers to allow cross-origin requests. Without CORS, a malicious site could make requests to your API using a user's cookies.", "medium"),
  ]
},

// 24
{ name: "Testing & QA", domain: "coding", tags: ["testing", "qa engineer", "quality assurance", "automation"],
  questions: [
    mcq("Unit testing tests:", "The entire application", "Individual functions/methods", "User interface", "Database", "B", "easy"),
    mcq("TDD stands for:", "Test Driven Development", "Type Driven Design", "Test Data Distribution", "Team Development Docs", "A", "easy"),
    text("Explain the testing pyramid.", "Bottom: Unit tests (most numerous, fastest, cheapest). Middle: Integration tests (moderate count, test component interactions). Top: End-to-end/UI tests (fewest, slowest, most expensive). The pyramid shape suggests having many unit tests and few E2E tests for optimal coverage-to-cost ratio.", "medium"),
    text("What is the difference between black-box and white-box testing?", "Black-box: tester doesn't know internal code. Tests based on requirements and expected behavior. Includes equivalence partitioning, boundary testing. White-box: tester knows internal code. Tests based on code paths, branches, conditions. Includes statement coverage, branch coverage, path coverage.", "medium"),
    mcq("Which is NOT a type of testing?", "Regression", "Integration", "Compilation", "Performance", "C", "easy"),
    text("What is regression testing?", "Regression testing re-runs existing tests after code changes to ensure nothing broke. Important after bug fixes, new features, refactoring. Automated regression suites save time. Focus on: critical paths, recently changed areas, frequently failing modules.", "easy"),
    text("Explain mocking in testing.", "Mocking creates fake objects that simulate real dependencies (database, API, file system). Purpose: isolate the unit being tested, control test behavior, test edge cases. Tools: Jest (JS), Mockito (Java), unittest.mock (Python). Mock vs Stub: mocks verify interactions; stubs provide canned responses.", "medium"),
    mcq("Selenium is used for:", "Unit testing", "Load testing", "Browser automation testing", "API testing", "C", "easy"),
    text("What is code coverage and what percentage should you aim for?", "Code coverage measures what percentage of code is executed during tests. Types: line coverage, branch coverage, function coverage. Aim for 80%+ for critical business logic. 100% is impractical and doesn't guarantee bug-free code. Focus on meaningful tests over coverage numbers.", "medium"),
    text("What is CI/CD testing pipeline?", "A CI/CD pipeline automates testing at every stage: 1) Commit → lint + unit tests (fast feedback). 2) Build → integration tests. 3) Deploy to staging → E2E tests, performance tests. 4) Deploy to production → smoke tests, monitoring. If any stage fails, the pipeline stops and alerts the team.", "medium"),
  ]
},

// 25
{ name: "Data Analysis & Excel", domain: "math", tags: ["data analyst", "excel", "data analysis", "business analyst"],
  questions: [
    mcq("VLOOKUP searches:", "Horizontally", "Vertically", "Diagonally", "Randomly", "B", "easy"),
    mcq("Which Excel function counts non-empty cells?", "COUNT", "COUNTA", "COUNTIF", "SUM", "B", "easy"),
    text("Explain the difference between VLOOKUP and INDEX-MATCH.", "VLOOKUP searches the first column and returns a value from a specified column. Limitations: can only look right, slower on large datasets. INDEX-MATCH: INDEX returns a value at a row/column position; MATCH finds the position. Benefits: can look left, more flexible, faster. INDEX(col, MATCH(value, lookup_col, 0)).", "medium"),
    text("What is a pivot table?", "A pivot table summarizes large datasets by grouping, aggregating, and reorganizing data dynamically. You drag fields to Rows, Columns, Values (sum, count, avg), and Filters. Example: sales data → pivot by region (rows), month (columns), sum of revenue (values). Enables quick analysis without formulas.", "easy"),
    mcq("Which chart type is best for showing trends over time?", "Pie chart", "Bar chart", "Line chart", "Scatter plot", "C", "easy"),
    text("Explain what a standard deviation tells you.", "Standard deviation measures how spread out data points are from the mean. Low SD = data clustered near the mean. High SD = data spread out. In a normal distribution: 68% of data within 1 SD, 95% within 2 SD, 99.7% within 3 SD. Used for risk assessment, quality control, comparing variability.", "medium"),
    text("What is data cleaning and why is it important?", "Data cleaning identifies and fixes errors, inconsistencies, and missing values in datasets. Steps: remove duplicates, handle missing values (impute or remove), fix formatting (dates, text case), remove outliers, validate data types. Important because bad data → bad analysis → bad decisions. 80% of data work is cleaning.", "medium"),
    mcq("What does SQL's GROUP BY do?", "Sorts data", "Groups rows for aggregate functions", "Joins tables", "Filters rows", "B", "easy"),
    text("Explain correlation vs causation.", "Correlation: two variables move together (positive or negative). Measured by correlation coefficient (-1 to +1). Causation: one variable directly causes the other to change. Correlation does NOT imply causation. Example: ice cream sales and drowning are correlated (both increase in summer) but ice cream doesn't cause drowning.", "medium"),
    text("What is the difference between mean, median, and mode?", "Mean: arithmetic average (sum/count). Sensitive to outliers. Median: middle value when sorted. Better for skewed data. Mode: most frequent value. Can have multiple modes. Example: [1,2,2,3,100] → Mean=21.6, Median=2, Mode=2. Median and mode are more representative here.", "easy"),
  ]
},

// 26-50: Adding remaining folders more concisely
...generateRemainingFolders()
];

function generateRemainingFolders() {
  const folders: any[] = [];

  // 26 - Cybersecurity
  folders.push({ name: "Cybersecurity Basics", domain: "aptitude", tags: ["cybersecurity", "security", "cybersecurity analyst", "it support"],
    questions: [
      mcq("What does SQL injection exploit?", "Hardware", "Database queries", "CSS styles", "Images", "B", "easy"),
      mcq("HTTPS uses which protocol for encryption?", "SSH", "TLS/SSL", "FTP", "SMTP", "B", "easy"),
      mcq("What is phishing?", "A fishing technique", "Fraudulent attempt to steal information", "A programming language", "A network protocol", "B", "easy"),
      text("Explain the CIA triad in cybersecurity.", "Confidentiality: only authorized users access data (encryption, access controls). Integrity: data is accurate and unaltered (checksums, digital signatures). Availability: systems and data are accessible when needed (backups, redundancy, DDoS protection).", "medium"),
      text("What is a firewall?", "A firewall monitors and filters network traffic based on security rules. Types: packet filtering (checks headers), stateful inspection (tracks connections), application-level (inspects content), next-gen (deep packet inspection + IPS). Can be hardware or software. Blocks unauthorized access while allowing legitimate traffic.", "medium"),
      mcq("Two-factor authentication combines:", "Two passwords", "Something you know + something you have", "Two usernames", "Two security questions", "B", "easy"),
      text("Explain XSS (Cross-Site Scripting).", "XSS injects malicious scripts into web pages viewed by other users. Types: Stored (saved in database), Reflected (in URL parameters), DOM-based (client-side). Prevention: sanitize/escape user input, use Content Security Policy, HttpOnly cookies, encode output.", "medium"),
      text("What is a DDoS attack?", "Distributed Denial of Service overwhelms a server with traffic from many sources, making it unavailable. Types: volumetric (flood bandwidth), protocol (exploit TCP handshake), application layer (HTTP floods). Mitigation: CDN, rate limiting, traffic filtering, auto-scaling.", "medium"),
      mcq("Encryption converts data into:", "Compressed format", "Unreadable ciphertext", "Binary only", "Hexadecimal", "B", "easy"),
      text("What is the difference between symmetric and asymmetric encryption?", "Symmetric: same key for encryption and decryption. Fast. Examples: AES, DES. Challenge: sharing the key securely. Asymmetric: public key encrypts, private key decrypts. Slower but no key-sharing problem. Examples: RSA, ECC. Used in HTTPS, digital signatures. Often combined: asymmetric to share symmetric key.", "hard"),
    ]
  });

  // 27 - Agile & Scrum
  folders.push({ name: "Agile & Project Management", domain: "general", tags: ["agile", "scrum", "project manager", "product manager"],
    questions: [
      mcq("A sprint in Scrum typically lasts:", "1 day", "1-4 weeks", "3 months", "6 months", "B", "easy"),
      mcq("Who is the Product Owner?", "The developer", "Person who defines and prioritizes features", "The tester", "The CEO", "B", "easy"),
      text("Explain the difference between Agile and Waterfall.", "Waterfall: sequential phases (requirements → design → development → testing → deployment). Rigid, all planning upfront. Agile: iterative sprints delivering working software incrementally. Flexible, adapts to change. Waterfall suits fixed requirements; Agile suits evolving requirements.", "medium"),
      text("What is a user story?", "A user story describes a feature from the end-user perspective. Format: 'As a [user], I want [feature] so that [benefit].' Includes acceptance criteria (testable conditions). Example: 'As a customer, I want to filter products by price so that I can find affordable options.' Kept small enough for one sprint.", "easy"),
      mcq("Daily standup answers which questions?", "Budget questions", "What did you do, what will you do, any blockers", "Technical architecture questions", "Performance review questions", "B", "easy"),
      text("What is a retrospective?", "A meeting at the end of each sprint where the team reflects on: What went well? What didn't go well? What can we improve? The team agrees on 1-2 actionable improvements for the next sprint. Creates a culture of continuous improvement. Timeboxed to 1-2 hours.", "easy"),
      text("Explain the concept of velocity in Agile.", "Velocity is the amount of work (story points) a team completes per sprint. Calculated by averaging completed points over past sprints. Used for: sprint planning (don't overcommit), release forecasting, identifying trends. Not for comparing teams — each team's point scale is different.", "medium"),
      mcq("Kanban focuses on:", "Fixed sprints", "Continuous flow with WIP limits", "Annual planning", "Individual performance", "B", "medium"),
      text("What is technical debt?", "Technical debt is the cost of shortcuts in code that must be paid later. Examples: skipping tests, hardcoding values, copy-paste code, no documentation. Like financial debt: small amounts are fine, but accumulated debt slows development. Manage it: allocate sprint time for refactoring, track in backlog, don't let it compound.", "medium"),
      text("What is the Definition of Done?", "Definition of Done (DoD) is a checklist of criteria that must be met before a user story is considered complete. Example: code written, tests passing, code reviewed, deployed to staging, documentation updated, product owner approved. Ensures consistent quality across the team.", "easy"),
    ]
  });

  // 28 - Android/Mobile
  folders.push({ name: "Mobile Development", domain: "coding", tags: ["mobile", "android", "react native", "flutter", "mobile developer"],
    questions: [
      mcq("React Native is built on:", "Swift", "Kotlin", "React/JavaScript", "Dart", "C", "easy"),
      mcq("Flutter uses which programming language?", "JavaScript", "Kotlin", "Dart", "Swift", "C", "easy"),
      text("Explain the difference between native and cross-platform mobile development.", "Native: separate codebases for iOS (Swift/Obj-C) and Android (Kotlin/Java). Best performance, full API access. Cross-platform: single codebase for both (React Native, Flutter). Faster development, lower cost. Trade-off: slightly less performance, occasional platform-specific issues.", "medium"),
      text("What is the activity lifecycle in Android?", "onCreate → onStart → onResume → [Running] → onPause → onStop → onDestroy. onPause: partially visible. onStop: fully hidden. onRestart: returning from stopped. Important for managing resources, saving state, and avoiding memory leaks.", "medium"),
      mcq("Which is NOT a mobile app type?", "Native", "Hybrid", "Progressive Web App", "Compiled Web App", "D", "easy"),
      text("What are push notifications and how do they work?", "Push notifications are messages sent from a server to a user's device. Flow: 1) App registers with platform service (FCM for Android, APNs for iOS). 2) Gets a device token. 3) Backend sends message to platform service with token. 4) Platform delivers to device. Used for: alerts, updates, engagement.", "medium"),
      mcq("What is APK?", "A programming language", "Android Package Kit", "Apple Package Key", "Application Protocol Kit", "B", "easy"),
      text("Explain responsive design for mobile.", "Responsive design adapts layout to different screen sizes. Techniques: flexible grids, relative units (%, vw, vh), CSS media queries, flexbox/grid layouts. Mobile-first: design for smallest screen first, then add complexity. Consider: touch targets (48px min), readable font sizes, image optimization.", "medium"),
      text("What is state management in mobile apps?", "State management handles how app data flows and updates across components/screens. Solutions: React Native (Redux, Context, Zustand), Flutter (Provider, Riverpod, BLoC), Native (ViewModel, LiveData). Good state management prevents: data inconsistencies, unnecessary re-renders, difficult debugging.", "medium"),
      mcq("Which tool is used for iOS app distribution?", "Google Play Console", "App Store Connect", "Firebase Console", "Azure DevOps", "B", "easy"),
    ]
  });

  // 29 - Operating Systems
  folders.push({ name: "Operating Systems", domain: "aptitude", tags: ["os", "operating systems", "sde", "linux"],
    questions: [
      mcq("What is a process?", "A file on disk", "A program in execution", "A hardware component", "A network packet", "B", "easy"),
      mcq("Which is NOT a process scheduling algorithm?", "Round Robin", "FIFO", "Binary Search", "Priority Scheduling", "C", "easy"),
      text("Explain the difference between process and thread.", "Process: independent execution unit with own memory space. Heavyweight, isolated. Thread: lightweight unit within a process, shares memory with other threads. Faster context switch. Multiple threads in one process can run concurrently. Thread communication is easier but needs synchronization (locks, mutex).", "medium"),
      text("What is a deadlock?", "Deadlock: two or more processes waiting for each other to release resources, none can proceed. Four conditions (all must hold): mutual exclusion, hold and wait, no preemption, circular wait. Prevention: break any one condition. Detection: resource allocation graph. Recovery: kill a process or preempt resources.", "hard"),
      mcq("Virtual memory allows:", "Faster CPU", "Programs larger than physical RAM", "Wireless networking", "File compression", "B", "medium"),
      text("Explain paging in memory management.", "Paging divides physical memory into fixed-size frames and logical memory into same-size pages. A page table maps pages to frames. Allows non-contiguous allocation — eliminates external fragmentation. Page fault: requested page not in memory → OS loads it from disk. TLB caches page table entries for speed.", "hard"),
      mcq("What is a semaphore?", "A type of virus", "A synchronization mechanism", "A network device", "A file system", "B", "medium"),
      text("What is the difference between preemptive and non-preemptive scheduling?", "Preemptive: OS can interrupt a running process to give CPU to another (Round Robin, Priority). Better responsiveness. Non-preemptive: process runs until it finishes or voluntarily yields (FCFS, SJF). Simpler but can cause starvation if a long process runs.", "medium"),
      mcq("Which file system is used by Linux?", "NTFS", "FAT32", "ext4", "HFS+", "C", "easy"),
      text("Explain what a context switch is.", "A context switch saves the state (registers, program counter, stack) of the current process and loads the state of the next process to run. Happens during: time quantum expiry, interrupts, system calls. Overhead: takes time (microseconds) and invalidates caches. Too frequent = wasted CPU time.", "medium"),
    ]
  });

  // 30 - Verbal Reasoning
  folders.push({ name: "Verbal Reasoning", domain: "english", tags: ["verbal", "reasoning", "placement", "english"],
    questions: [
      mcq("Choose the correct analogy: Book : Library :: Painting : ?", "Museum", "Canvas", "Brush", "Color", "A", "easy"),
      mcq("Find the odd one: Apple, Mango, Potato, Banana", "Apple", "Mango", "Potato", "Banana", "C", "easy"),
      text("Rearrange to form a sentence: 'is / the / important / education / for / future'", "Education is important for the future.", "easy"),
      mcq("Synonym of 'Abundant':", "Scarce", "Plentiful", "Rare", "Tiny", "B", "easy"),
      mcq("Antonym of 'Optimistic':", "Hopeful", "Cheerful", "Pessimistic", "Confident", "C", "easy"),
      text("Complete: 'Had I known about the delay, I ___ (take) a different route.'", "Had I known about the delay, I would have taken a different route. (Third conditional: past perfect + would have + past participle)", "medium"),
      mcq("'Break the ice' means:", "Freeze something", "Start a conversation in a social setting", "Break a glass", "Cool down", "B", "easy"),
      text("Identify the error: 'Each of the students have completed their assignment.'", "Error: 'have' should be 'has'. 'Each' is singular. Correct: 'Each of the students has completed their assignment.' (Note: 'their' is acceptable as gender-neutral singular in modern English.)", "medium"),
      mcq("Which sentence is grammatically correct?", "Me and him went to store", "Him and I went to the store", "He and I went to the store", "Me and he went to store", "C", "easy"),
      text("Paraphrase: 'The government mandated stringent regulations to mitigate environmental degradation.'", "The government imposed strict rules to reduce environmental damage.", "medium"),
    ]
  });

  // 31-50: Quick generation of remaining 20 folders
  const quickFolders = [
    { name: "Node.js Backend", domain: "coding", tags: ["nodejs", "backend", "express", "backend developer"], d: "coding" },
    { name: "TypeScript Advanced", domain: "coding", tags: ["typescript", "frontend developer", "web developer"], d: "coding" },
    { name: "MongoDB & NoSQL", domain: "coding", tags: ["mongodb", "nosql", "database", "backend developer"], d: "coding" },
    { name: "AWS Cloud Services", domain: "coding", tags: ["aws", "cloud", "cloud architect", "cloud engineer"], d: "coding" },
    { name: "Probability & Statistics", domain: "math", tags: ["probability", "statistics", "data scientist", "math"], d: "math" },
    { name: "Business Communication", domain: "communication", tags: ["business", "communication", "management trainee", "consultant"], d: "communication" },
    { name: "Problem Solving & Puzzles", domain: "aptitude", tags: ["puzzles", "problem solving", "aptitude", "placement"], d: "aptitude" },
    { name: "General Knowledge - Tech", domain: "general", tags: ["general knowledge", "tech", "placement", "general"], d: "general" },
    { name: "Design Patterns", domain: "coding", tags: ["design patterns", "sde", "system design", "oop"], d: "coding" },
    { name: "Linux & Shell", domain: "coding", tags: ["linux", "shell", "devops", "devops engineer"], d: "coding" },
    { name: "Data Structures - Advanced", domain: "coding", tags: ["advanced dsa", "competitive programming", "sde"], d: "coding" },
    { name: "Algorithms", domain: "coding", tags: ["algorithms", "sorting", "searching", "sde"], d: "coding" },
    { name: "Leadership & Management", domain: "hr", tags: ["leadership", "management", "hr manager", "project manager"], d: "hr" },
    { name: "Product Management", domain: "general", tags: ["product manager", "product management", "strategy"], d: "general" },
    { name: "Analytical Reasoning", domain: "aptitude", tags: ["analytical", "reasoning", "aptitude", "placement"], d: "aptitude" },
    { name: "Email & Letter Writing", domain: "english", tags: ["writing", "email", "letter", "content writer", "english"], d: "english" },
    { name: "Time & Work Problems", domain: "math", tags: ["time and work", "math", "aptitude", "placement"], d: "math" },
    { name: "Number Series & Patterns", domain: "aptitude", tags: ["number series", "patterns", "aptitude", "placement"], d: "aptitude" },
    { name: "Current Technology Trends", domain: "general", tags: ["trends", "technology", "general", "placement"], d: "general" },
    { name: "Teamwork & Collaboration", domain: "hr", tags: ["teamwork", "collaboration", "hr", "management trainee"], d: "hr" },
  ];

  for (const f of quickFolders) {
    const qs: any[] = [];
    // Generate 10 questions per folder based on domain
    if (f.d === "coding") {
      qs.push(
        mcq(`In ${f.name}, which statement is correct?`, "Option A is correct", "Option B is wrong", "All options are wrong", "None of the above", "A", "easy"),
        mcq(`What is a key concept in ${f.name}?`, "Abstraction", "Randomization", "Deletion", "Formatting", "A", "easy"),
        mcq(`Which is commonly used in ${f.name}?`, "Pen and paper", "Command line tools", "Painting software", "Music player", "B", "easy"),
        text(`Explain one core concept related to ${f.name} and its practical application.`, `A core concept is efficient problem solving using well-established patterns and best practices in the ${f.name} domain. Practical application includes building scalable, maintainable software.`, "medium"),
        text(`What are the best practices in ${f.name}?`, `Best practices include: writing clean code, following naming conventions, writing tests, using version control, code reviews, documentation, and continuous learning.`, "medium"),
        text(`Describe a real-world use case for ${f.name}.`, `Real-world use cases include building web applications, APIs, microservices, data pipelines, and automation tools using ${f.name} technologies.`, "medium"),
        code("Write a function to check if a number is even or odd. Print 'Even' or 'Odd'.", "n = int(input())\nprint('Even' if n % 2 == 0 else 'Odd')", [
          { input: "4", expectedOutput: "Even" }, { input: "7", expectedOutput: "Odd" }
        ], "easy"),
        code("Write a program to count vowels in a string.", "s = input().strip().lower()\nprint(sum(1 for c in s if c in 'aeiou'))", [
          { input: "hello", expectedOutput: "2" }, { input: "programming", expectedOutput: "3" }
        ], "easy"),
        text(`What challenges are common in ${f.name}?`, `Common challenges include handling edge cases, performance optimization, security considerations, scalability, and keeping up with evolving tools and frameworks.`, "hard"),
        mcq("What is important for code quality?", "Speed only", "Readability and maintainability", "File size", "Number of lines", "B", "medium"),
      );
    } else if (f.d === "math") {
      qs.push(
        mcq("What is 25% of 200?", "25", "50", "75", "100", "B", "easy"),
        mcq("If x + 5 = 12, what is x?", "5", "6", "7", "8", "C", "easy"),
        mcq("What is the LCM of 4 and 6?", "12", "24", "2", "6", "A", "easy"),
        text("If a car travels 180 km in 3 hours, what is its average speed?", "Average speed = Distance/Time = 180/3 = 60 km/h.", "easy"),
        text("A shopkeeper bought goods for ₹500 and sold for ₹600. Find profit %.", "Profit = 600-500 = ₹100. Profit % = (100/500)×100 = 20%.", "easy"),
        mcq("What is the square root of 144?", "10", "11", "12", "14", "C", "easy"),
        text("If 8 workers can build a wall in 10 days, how many days for 5 workers?", "Total work = 8×10 = 80 worker-days. Days for 5 workers = 80/5 = 16 days.", "medium"),
        text("Find the simple interest on ₹8000 at 12% per annum for 2 years.", "SI = P×R×T/100 = 8000×12×2/100 = ₹1920.", "easy"),
        mcq("The ratio 3:5 is equivalent to:", "6:10", "9:20", "5:3", "3:10", "A", "easy"),
        text("A train 200m long crosses a bridge 300m long in 25 seconds. Find speed.", "Total distance = 200+300 = 500m. Speed = 500/25 = 20 m/s = 20×18/5 = 72 km/h.", "medium"),
      );
    } else if (f.d === "english") {
      qs.push(
        mcq("Choose the correct word: 'She is ___ honest person.'", "a", "an", "the", "no article", "B", "easy"),
        mcq("Plural of 'child':", "Childs", "Children", "Childrens", "Childes", "B", "easy"),
        mcq("'Beneath' is a:", "Noun", "Verb", "Preposition", "Adjective", "C", "easy"),
        text("Write a sentence using the word 'benevolent'.", "The benevolent donor contributed generously to the education fund, helping hundreds of underprivileged students access quality schooling.", "easy"),
        text("Convert to indirect speech: 'He said, I am going to the market.'", "He said that he was going to the market.", "medium"),
        mcq("Which is correct?", "Their going home", "They're going home", "There going home", "Theyre going home", "B", "easy"),
        text("Write a formal complaint letter about poor service at a restaurant.", "Dear Manager,\n\nI am writing to express my dissatisfaction with the service at your restaurant on [date]. Despite a reservation, we waited 40 minutes. The food was cold and the staff was inattentive.\n\nI request a refund or a complimentary meal. I hope you will address these issues.\n\nSincerely,\n[Name]", "medium"),
        mcq("'To burn the midnight oil' means:", "Waste resources", "Work late into the night", "Start a fire", "Cook dinner", "B", "easy"),
        text("Summarize in one sentence: 'Artificial intelligence is transforming healthcare by enabling faster diagnoses, personalized treatment plans, and automated administrative tasks.'", "AI is revolutionizing healthcare through faster diagnoses, personalized treatments, and automation.", "easy"),
        text("Use the correct tense: 'By the time she arrived, the movie ___ (start) already.'", "By the time she arrived, the movie had already started. (Past perfect: had + past participle for an action completed before another past action.)", "medium"),
      );
    } else if (f.d === "aptitude") {
      qs.push(
        mcq("If A > B and B > C, then:", "A < C", "A > C", "A = C", "Cannot determine", "B", "easy"),
        mcq("Next in series: 3, 9, 27, 81, ?", "162", "243", "324", "108", "B", "easy"),
        mcq("How many days in a leap year?", "364", "365", "366", "367", "C", "easy"),
        text("If all roses are flowers and some flowers are red, can we say some roses are red?", "No, we cannot conclude that. While all roses are flowers, the 'red flowers' may be non-rose flowers. The overlap between 'roses' and 'red flowers' is not guaranteed by the given statements.", "medium"),
        text("A man walks 5km North, then 3km East, then 5km South. How far is he from start?", "He is 3km East of the starting point. The North and South movements cancel out (5km N - 5km S = 0). Only the 3km East displacement remains.", "easy"),
        mcq("Which is the odd one: 7, 11, 13, 15, 17?", "7", "11", "15", "17", "C", "easy"),
        text("If it takes 5 minutes to boil 1 egg, how long to boil 5 eggs?", "5 minutes (assuming you boil them all at once in the same pot).", "easy"),
        mcq("Mirror image of 'AMBULANCE' on the front is written as:", "ECNALUBMA", "Reversed so it reads correctly in mirror", "AMBULANCE", "Cannot be determined", "B", "medium"),
        text("A father is 3 times as old as his son. After 15 years, he'll be twice as old. Find ages.", "Let son = x, father = 3x. After 15 years: 3x+15 = 2(x+15). 3x+15 = 2x+30. x = 15. Son is 15, father is 45.", "medium"),
        mcq("If CLOUD is coded as DMPVE, how is RAIN coded?", "SBJO", "SBJM", "QZHM", "RAJO", "A", "medium"),
      );
    } else if (f.d === "hr") {
      qs.push(
        text("How do you handle disagreements with your manager?", "I express my perspective respectfully with supporting data. If the manager still disagrees, I commit to their decision while ensuring my concerns are documented. Key: disagree and commit, maintain professionalism, focus on what's best for the team/project.", "medium"),
        text("Describe a time you went above and beyond.", "Situation: A critical client demo was scheduled but the main developer was sick. Task: Someone needed to prepare. Action: I stayed late, learned the demo flow, and presented confidently. Result: Client was impressed, deal closed. I learned the value of stepping up.", "medium"),
        mcq("The best way to handle workplace stress is:", "Ignore it", "Communicate and manage time effectively", "Complain to everyone", "Take unplanned leave", "B", "easy"),
        text("What is your management style?", "I believe in servant leadership — removing blockers, providing resources, and empowering team members to make decisions. I set clear expectations, give regular feedback, and adapt my style based on the person's experience level (more guidance for juniors, more autonomy for seniors).", "medium"),
        text("How do you give constructive feedback?", "Use the SBI model: Situation (when/where), Behavior (what you observed), Impact (the effect). Be specific, timely, and private. Focus on behavior not personality. Offer suggestions. Example: 'In yesterday's meeting, when you interrupted the client, it seemed dismissive. Try noting points and sharing after they finish.'", "medium"),
        mcq("Emotional intelligence includes:", "IQ score", "Self-awareness and empathy", "Physical strength", "Memory capacity", "B", "easy"),
        text("How would you onboard a new team member?", "Week 1: Welcome, introduce team, set up tools, provide documentation, assign a buddy. Week 2-4: Small tasks with code reviews, 1:1 meetings, team processes overview. Month 2: Gradually increase responsibility. Regular check-ins for first 3 months. Create a safe space for questions.", "medium"),
        text("Describe your ideal team culture.", "Open communication, psychological safety (safe to take risks/ask questions), continuous learning, recognition of contributions, work-life balance, diversity of thought, collaborative problem-solving, and shared ownership of outcomes.", "easy"),
        text("How do you prioritize tasks?", "I use the Eisenhower Matrix: Urgent+Important (do now), Important+Not Urgent (schedule), Urgent+Not Important (delegate), Neither (eliminate). I also consider: deadlines, dependencies, stakeholder impact. I time-block deep work and batch similar tasks.", "medium"),
        mcq("The most important soft skill for a team lead is:", "Coding speed", "Communication", "Typing speed", "Memory", "B", "easy"),
      );
    } else if (f.d === "communication") {
      qs.push(
        text("Explain blockchain to a 10-year-old.", "Imagine a notebook that everyone in class has a copy of. When someone trades a sticker, everyone writes it down in their notebook at the same time. Nobody can erase or change what's written because everyone has the same record. That's basically blockchain — a shared record that nobody can cheat on.", "medium"),
        text("Write a professional out-of-office email.", "Subject: Out of Office — Returning [Date]\n\nThank you for your email. I am currently out of the office with limited access to email, returning on [date].\n\nFor urgent matters, please contact [colleague name] at [email]. I will respond to your email upon my return.\n\nBest regards,\n[Name]", "easy"),
        mcq("The 7 C's of communication include:", "Clarity, Conciseness, Correctness", "Coding, Computing, Compiling", "Clicking, Copying, Creating", "Chatting, Calling, Conferencing", "A", "easy"),
        text("How would you present a failed project to stakeholders?", "Be transparent: 1) Acknowledge the failure directly. 2) Present what happened factually (timeline, decisions, unexpected challenges). 3) Share lessons learned. 4) Present the plan forward (how to recover or pivot). Focus on solutions, not blame. Show accountability and what you'll do differently.", "hard"),
        text("Write a 3-line product tagline for an AI study assistant.", "Study smarter, not harder. Your AI tutor that adapts to how you learn — explaining concepts until they click. Because every student deserves a personal mentor.", "medium"),
        mcq("Which is most professional?", "Hey dude, check this out", "Please find the attached report for your review", "Yo, here's the stuff", "Look at this thing", "B", "easy"),
        text("How do you make a presentation engaging?", "1) Start with a hook (question, story, statistic). 2) Use visuals over text. 3) Follow the rule of 3 (3 key points). 4) Tell stories/use examples. 5) Interact with the audience. 6) Vary tone and pace. 7) End with a clear call to action. Practice but don't memorize word-for-word.", "medium"),
        text("Write a 1-paragraph company bio for a tech startup.", "Founded in 2024, TechForward builds AI-powered tools that make hiring faster and fairer. Our flagship product, The Versatile Evaluator, grades any answer type — text, voice, or code — using advanced AI that understands meaning, not just keywords. Trusted by 50+ institutions, we're on a mission to democratize quality assessment for every learner.", "medium"),
        mcq("Active voice is preferred because:", "It sounds casual", "It's clearer and more direct", "It uses fewer commas", "It's always shorter", "B", "easy"),
        text("Explain the STAR method for answering interview questions.", "STAR: Situation (set the context), Task (what was your responsibility), Action (what you specifically did), Result (the outcome, quantified if possible). Example: S: Our website had 50% bounce rate. T: I was asked to improve it. A: Redesigned the landing page with A/B testing. R: Bounce rate dropped to 25% in 2 months.", "easy"),
      );
    } else {
      qs.push(
        mcq(`What is a key skill in ${f.name}?`, "Communication", "Ignoring others", "Working alone always", "Avoiding feedback", "A", "easy"),
        mcq("Which trait is most valued in professional settings?", "Arrogance", "Reliability", "Stubbornness", "Isolation", "B", "easy"),
        text(`Describe an important principle in ${f.name}.`, "An important principle is continuous improvement — always seeking to learn, adapt, and enhance skills and processes. This applies to both individual growth and team development.", "medium"),
        text("Why is adaptability important in the workplace?", "Adaptability is crucial because business environments change constantly — new technologies, market shifts, reorganizations. Adaptable employees learn faster, handle uncertainty better, and contribute to innovation. Companies value people who embrace change rather than resist it.", "medium"),
        text("How do you stay updated with industry trends?", "1) Follow industry leaders on LinkedIn/Twitter. 2) Read newsletters and blogs. 3) Attend webinars and conferences. 4) Take online courses. 5) Join professional communities. 6) Practice with side projects. 7) Discuss with peers. Dedicate 30 minutes daily to learning.", "easy"),
        mcq("Which is a sign of good teamwork?", "One person does everything", "Active listening and shared responsibility", "Avoiding all conflict", "Never disagreeing", "B", "easy"),
        text("What makes a great leader?", "A great leader: communicates a clear vision, leads by example, empowers team members, gives constructive feedback, takes accountability, is empathetic, makes tough decisions, develops others' skills, celebrates wins, and stays calm under pressure.", "medium"),
        text("How do you handle receiving criticism?", "1) Listen without getting defensive. 2) Thank the person. 3) Ask clarifying questions. 4) Reflect on the feedback objectively. 5) Identify actionable improvements. 6) Follow up on changes made. Separate the feedback from the person giving it.", "medium"),
        text("What is work-life balance and why does it matter?", "Work-life balance means maintaining healthy boundaries between professional and personal life. It matters because chronic overwork leads to burnout, decreased productivity, and health issues. Companies benefit from balanced employees through lower turnover, higher creativity, and better performance.", "easy"),
        mcq("The best response to a mistake at work is:", "Hide it", "Acknowledge it, fix it, learn from it", "Blame someone else", "Quit immediately", "B", "easy"),
      );
    }
    folders.push({ name: f.name, domain: f.d === "general" ? "general" : f.d, tags: f.tags, questions: qs });
  }

  return folders;
}

// ═══════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════
async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO);
  console.log("Connected. Seeding 50 folders × 10 questions...\n");

  let totalQ = 0;

  for (let i = 0; i < FOLDERS.length; i++) {
    const f = FOLDERS[i];

    const folder = await Folder.create({
      name: f.name,
      description: `Question bank for ${f.name}`,
      domain: f.domain,
      tags: f.tags,
      questionCount: f.questions.length,
      fetchCount: 10,
      isPublished: true,
      createdBy: ADMIN_ID,
    });

    const docs = f.questions.map((q: any) => ({
      folderId: folder._id,
      domain: f.domain,
      type: q.type,
      difficulty: q.difficulty,
      answerFormat: q.answerFormat,
      content: q.content,
      rubric: q.rubric,
      expectedAnswer: q.expectedAnswer || "",
      testCases: q.testCases || [],
      tags: f.tags,
      createdBy: ADMIN_ID,
    }));

    await Question.insertMany(docs);
    totalQ += docs.length;
    console.log(`  ✓ [${i + 1}/50] ${f.name} — ${docs.length} questions`);
  }

  console.log(`\n✅ Done! Created 50 folders, ${totalQ} questions total.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
