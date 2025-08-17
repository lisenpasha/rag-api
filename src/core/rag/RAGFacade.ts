import { OpenAIEmbedder } from '../../adapters/embedder/OpenAIEmbedder';
import { OpenAIChat } from '../../adapters/llm/OpenAIChat';
import { Retrieval } from './Retrieval';
import { buildAnswer } from './Answer';
import { APP_CONFIG } from '../../../config/app';


/**
 * Facade pattern. Provides a single public entry point (`ask`) that orchestrates
 * the complete RAG flow. This hides the internal steps (embedding, retrieval,
 * answer building, LLM call) behind one simple method and keeps the API layer
 * decoupled from the inner logic.
 */
export class RAGFacade {
  constructor(
    private retrieval: Retrieval,
    private embedder: OpenAIEmbedder,
    private llm: OpenAIChat
  ) {}

  /**
   * Main RAG flow:
   * - embed the question
   * - retrieve top K chunks
   * - build combined answer (or fail)
   * - use OpenAIChat to generate the final answer
   */
  async ask(question: string): Promise<{ status: number; body: any }> {
    try {
      // 1) Embed the question
      const qVector = await this.embedder.embed(question);

      // 2) Retrieve topK chunks
      const topChunks = this.retrieval.search(qVector, APP_CONFIG.topK);


      // 3) Build answer content
      const answerResult = buildAnswer(topChunks);

      // 4) If not ok → return 422
      if (!answerResult.ok) {
        return { status: 422, body: { message: answerResult.message } };
      }

      // 5) Otherwise use LLM to generate final answer
      const llmText = await this.llm.answer(question, answerResult.content);

      return {
        status: 200,
        body: {
          answer: llmText,
          citations: answerResult.citations
        }
      };
    } catch (err) {
      console.error('Unexpected RAG error:', err);
      return {
        status: 500,
        body: {
          message: 'Unexpected server error'
        }
      };
    }
  }
}
