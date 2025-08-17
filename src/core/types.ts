// Single chunk of a PDF, with its embedding
export type Chunk = {
  id: string;          // unique id (e.g. "Zeiss_OPMI_Pentero-0")
  pdfId: string;       // e.g. "Zeiss_OPMI_Pentero"
  source: string;      // file name (e.g. "Zeiss_OPMI_Pentero.pdf")
  chunkIndex: number;  // 0, 1, 2, ...
  text: string;        // content of the chunk
  embedding: number[]; // float vector from OpenAI, 1536 dimensions
};

// Internal structure for cosine results
export type Retrieved = {
  chunk: Chunk;
  score: number;
};