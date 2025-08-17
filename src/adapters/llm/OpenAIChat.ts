import { openai } from '../openai/OpenAIClient';

export class OpenAIChat {
  async answer(question: string, retrievedContent: string): Promise<string> {
    const systemMessage = `
You are a Retrieval-Augmented Generation (RAG) assistant. 
You will answer questions using ONLY the content contained in the **Retrieved document content**.

Context:
- The user’s question refers to technical medical documentation (e.g. device manuals or technical reference tables).
- The “Retrieved document content” consists of one or more document excerpts that were selected based on semantic similarity.

Strict policy:
1. You must ground your answer **exclusively** in the Retrieved document content.  
   → If the retrieved content does NOT contain the answer, respond exactly with:  
     “This information is not available in the provided documentation.”

2. You must **not summarize or shorten** information if the answer is explicitly stated in the retrieved content.  
   → Instead, **reproduce all relevant lines verbatim**, including step-by-step instructions, tables or detailed procedures.

3. If the requested information spans **multiple sentences or rows** in the retrieved content, you must include **all of them** so that the answer is complete and precise.  
   → Do NOT remove or skip any relevant sentence.

4. If the retrieved content contains **non-relevant information** (such as optional configuration notes, warnings, or additional modules that are clearly not required to answer the question), **exclude** those from the answer.  
   → Focus ONLY on the part that directly answers the question.

5. Never speculate, generalize, or use prior knowledge.
   → Only use the words and facts present in the retrieved content.

Goal:
Provide a **precise**, **complete**, and **verbatim** answer from the retrieved documentation, and do **not** invent, shorten, or guess.
`;


    const userMessage = `
Question:
${question}

Retrieved document content:
${retrievedContent}
    `;

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.0
      });
      return res.choices[0].message?.content || '';
    } catch (err) {
      console.error('Error while generating answer:', err);
      throw err;
    }
  }
}
