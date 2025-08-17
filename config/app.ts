export const APP_CONFIG = {
  indexPath: 'assets/index/index.json', // path to the precomputed index
  simThreshold: 0.4,                    // cosine similarity threshold
  topK: 5,                              // number of top chunks to return
  port: 3000,                           // Express server port
} as const;                             // Stronger type-safety
