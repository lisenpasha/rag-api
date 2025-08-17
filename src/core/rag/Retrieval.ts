import { Chunk, Retrieved } from '../types';
import { cosine } from '../../utils/cosine';

export class Retrieval {
  /**
   * We store a **reference** to the array of chunks loaded
   * by StaticJsonIndex (we do NOT duplicate or re-save it).
   */
  constructor(private chunks: Chunk[]) {}

  /**
   * Given a question embedding, return the top K chunks sorted by cosine score.
   */
  search(queryVector: number[], topK: number): Retrieved[] {
    const scored: Retrieved[] = this.chunks.map((chunk) => {
      const score = cosine(queryVector, chunk.embedding);
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

    getChunks(): Chunk[] {
    return this.chunks;
  }
}
