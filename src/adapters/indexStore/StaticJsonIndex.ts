import fs from 'node:fs';
import { Chunk } from '../../core/types';

/**
 * Loads the precomputed chunks + embeddings from index.json
 * (assets/index/index.json) at runtime.
 */
export class StaticJsonIndex {
  private chunks: Chunk[] = [];

  constructor(private path: string) {}

  load(): void {
    const raw = fs.readFileSync(this.path, 'utf-8');
    // our index file format is:  { vectors: Chunk[] }
    const json = JSON.parse(raw);
    this.chunks = json.vectors as Chunk[];
  }

  all(): Chunk[] {
    return this.chunks;
  }
}
