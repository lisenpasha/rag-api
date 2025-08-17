import { openai } from '../openai/OpenAIClient';

/**
 * Wrapper around the OpenAI embedding API.
 * Used to embed the input question at runtime.
 */
export class OpenAIEmbedder {
  async embed(question: string): Promise<number[]> {
    try {
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question
      });
      return res.data[0].embedding as number[];
    } catch (err) {
      console.error('Error while embedding the question:', err);
      throw err;
    }
  }
}
