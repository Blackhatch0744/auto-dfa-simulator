import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { condition, alphabet } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // We add generationConfig to FORCE the AI to only speak in raw JSON code
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Automata Theory compiler. 
      Generate a minimal Deterministic Finite Automaton (DFA).
      Alphabet: {${alphabet}}
      Condition: "${condition}"
      
      Format strictly like this example:
      {
        "states": ["q0", "q1"],
        "alphabet": ["0", "1"],
        "startState": "q0",
        "acceptStates": ["q1"],
        "transitions": {
          "q0": { "0": "q1", "1": "q0" },
          "q1": { "0": "q1", "1": "q0" }
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    
    // Now we can safely parse it because the AI is forced to return pure code
    const dfaData = JSON.parse(textResult);
    return NextResponse.json(dfaData);

  } catch (error) {
    console.error("Backend Error:", error);
    return NextResponse.json({ error: 'Failed to generate DFA.' }, { status: 500 });
  }
}