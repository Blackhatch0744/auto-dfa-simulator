"use client";

import { useState, useEffect, useRef } from 'react';

export default function SmartDFASimulator() {
  // --- PASSWORD GATE STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  const handleLogin = () => {
    // CHANGE YOUR SECRET PASSWORD HERE:
    if (passwordInput === "atcd2026") {
      setIsUnlocked(true);
    } else {
      alert("Incorrect password!");
    }
  };

  // --- DFA SIMULATOR STATE ---
  const [alphabet, setAlphabet] = useState("0, 1");
  const [condition, setCondition] = useState("");
  const [testString, setTestString] = useState("");
  const [dfaInfo, setDfaInfo] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  const generateDFAFromCondition = async () => {
    if (!condition || !alphabet) return;
    setIsGenerating(true);
    setResult(null);
    setDfaInfo(null);
    
    try {
      const response = await fetch('/api/dfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition, alphabet })
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setDfaInfo(data);
    } catch (error) {
      alert("Error generating DFA. Make sure your API key is correct!");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (dfaInfo && graphRef.current) {
      let graphDef = `graph LR\nclassDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;\nclassDef accept fill:#dcfce7,stroke:#16a34a,stroke-width:4px;\n`;
      const safeStates = Array.isArray(dfaInfo.states) ? dfaInfo.states.map(String) : [];
      const safeAccepts = Array.isArray(dfaInfo.acceptStates) ? dfaInfo.acceptStates.map(String) : [];

      safeStates.forEach((state: string) => {
        const isAccept = safeAccepts.includes(state);
        graphDef += `${state}((${state}))\n`;
        if (isAccept) graphDef += `class ${state} accept;\n`;
      });

      safeStates.forEach((state: string) => {
        const trans = dfaInfo.transitions[state];
        if (trans) {
          Object.keys(trans).forEach(char => {
            graphDef += `${state} -->|${char}| ${trans[char]}\n`;
          });
        }
      });

      import('mermaid').then(mermaid => {
        mermaid.default.initialize({ startOnLoad: false });
        const safeId = 'mermaid-graph-' + Date.now();
        mermaid.default.render(safeId, graphDef).then(({ svg }) => {
          if (graphRef.current) graphRef.current.innerHTML = svg;
        }).catch(err => console.error(err));
      });
    }
  }, [dfaInfo]);

  const runTest = () => {
    if (!dfaInfo) { alert("Please generate a DFA first!"); return; }
    let currentState = String(dfaInfo.startState || Array.isArray(dfaInfo.states) ? dfaInfo.states[0] : "q0");
    const path = [currentState];
    const safeAlphabet = Array.isArray(dfaInfo.alphabet) ? dfaInfo.alphabet.map((a: any) => String(a).trim()) : [];
    const safeAcceptStates = Array.isArray(dfaInfo.acceptStates) ? dfaInfo.acceptStates.map((a: any) => String(a).trim()) : [];
    const safeTestString = testString || ""; 

    for (let char of safeTestString) {
      if (!safeAlphabet.includes(char)) {
        setResult({ accepted: false, reason: `Symbol '${char}' is not in the alphabet.`, path }); return;
      }
      const stateTransitions = dfaInfo.transitions[currentState];
      if (!stateTransitions || !stateTransitions[char]) {
        setResult({ accepted: false, reason: `Halted: Missing rule for state '${currentState}' reading '${char}'`, path }); return;
      }
      currentState = String(stateTransitions[char]);
      path.push(currentState);
    }
    const accepted = safeAcceptStates.includes(currentState);
    setResult({ accepted, reason: accepted ? "Valid string!" : "Rejected.", path });
  };

  // --- PASSWORD SCREEN RENDER ---
  if (!isUnlocked) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md flex flex-col gap-4 text-center">
          <h1 className="text-2xl font-bold text-blue-700">DFA Simulator Access</h1>
          <p className="text-sm text-gray-500">Please enter the password to use this tool.</p>
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="border-2 p-2 rounded border-blue-200 text-center tracking-widest" 
            placeholder="••••••••"
          />
          <button onClick={handleLogin} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">
            Enter
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="max-w-6xl mx-auto p-8 font-sans text-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-blue-700">DFA Simulator Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-4 bg-gray-50 p-6 rounded-lg border shadow-sm h-fit">
          <h2 className="text-xl font-bold border-b pb-2">1. Enter the aplhabets and condition</h2>
          <label className="font-semibold text-sm">Alphabet (Σ)</label>
          <input value={alphabet} onChange={(e) => setAlphabet(e.target.value)} className="border p-2 rounded" />
          
          <label className="font-semibold text-sm">Condition (Plain English)</label>
          <textarea value={condition} onChange={(e) => setCondition(e.target.value)} className="border p-2 rounded h-24" />
          
          <button onClick={generateDFAFromCondition} disabled={isGenerating} className={`w-full text-white p-3 rounded font-bold transition-colors ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isGenerating ? 'AI is calculating...' : 'Generate DFA'}
          </button>

          <div className="mt-4 bg-white p-4 rounded border border-gray-200 shadow-inner">
            <h2 className="text-lg font-bold border-b pb-2 mb-2">2. Test String</h2>
            <input value={testString} onChange={(e) => setTestString(e.target.value)} className="border-2 p-2 rounded border-blue-400 w-full mb-2 tracking-widest text-center font-mono text-lg" />
            <button onClick={runTest} className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-900 font-bold">Run Test</button>
            {result && (
              <div className={`mt-4 p-3 rounded border-2 text-center ${result.accepted ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'}`}>
                <h3 className="text-xl font-black mb-1">{result.accepted ? 'ACCEPTED' : 'REJECTED'}</h3>
                <p className="text-xs font-mono opacity-80 mt-2 break-words">{result.path.join(' → ')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold border-b pb-2">DFA Graph</h2>
          <div ref={graphRef} className="flex justify-center items-center w-full min-h-[400px] bg-slate-50 border rounded-lg overflow-x-auto p-4">
             {!dfaInfo && !isGenerating && <p className="text-gray-400">Enter a condition and click Generate...</p>}
          </div>
          <details className="mt-2 cursor-pointer">
            <summary className="font-semibold text-sm text-blue-600">View Mathematical Tuple Data (Q, Σ, δ, q0, F)</summary>
            {dfaInfo && <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded mt-2 overflow-auto max-h-48">{JSON.stringify(dfaInfo, null, 2)}</pre>}
          </details>
        </div>
      </div>
    </div>
  );
}