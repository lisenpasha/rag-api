import { Retrieved } from '../types';
import { APP_CONFIG } from '../../../config/app';

export type AnswerResult =
  | { ok: true; content: string; citations: { source: string; chunkIndex: number }[] }
  | { ok: false; message: string };


/**
 * Takes the retrieved chunks and applies the second stage of RAG logic.
 * - Filters out chunks below the similarity threshold
 * - If none are considered relevant → returns a "not found" response
 * - Otherwise combines the remaining chunks (with score labels) into a single
 *   text block for the LLM, and returns that along with citations.
 *
 * This keeps the answer generation deterministic and grounded in the actual retrieval results.
 */
export function buildAnswer(topChunks: Retrieved[]): AnswerResult {
  // 1) safety check – no chunks returned by retrieval
  if (topChunks.length === 0) {
    return { ok: false, message: 'No chunks found.' };
  }

  // 2) filter chunks whose score is >= threshold
  const relevantChunks = topChunks.filter(
    (r) => r.score >= APP_CONFIG.simThreshold
  );

  // 3) if none passes threshold – return a "not found" response
  if (relevantChunks.length === 0) {
    return {
      ok: false,
      message:
        'This information is not available in the provided documentation.'
    };
  }

  // 4) combine text of all relevant chunks,
  //    adding a label and the cosine score so the LLM knows which is more relevant
  const combinedText = relevantChunks
    .map((r, index) => {
      return `[Chunk ${index + 1} – score: ${r.score.toFixed(3)}]\n${r.chunk.text}`;
    })
    .join('\n\n');

  // 5) build a list of citations that show where content came from
  const citations = relevantChunks.map((r) => ({
    source: r.chunk.source,
    chunkIndex: r.chunk.chunkIndex
  }));

  // 6) return final result for LLM to consume
  return {
    ok: true,
    content: combinedText,
    citations
  };
}
