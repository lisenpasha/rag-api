import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Location of PDF folder and index file
const PDF_DIR = path.join(__dirname, '../assets/pdfs');
const INDEX_FILE = path.join(__dirname, '../assets/index/index.json');

// Chunk size (words)
const CHUNK_SIZE = 300;

async function readPdfText(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);
  return result.text; // all text (whole pdf)
}

function chunkText(text: string, size: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    const slice = words.slice(i, i + size).join(' ');
    chunks.push(slice);
  }
  return chunks;
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return res.data[0].embedding as number[];
}

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  const indexData: any[] = []; // will hold all {id, pdfId, source, chunkIndex, text, embedding}

  for (const file of files) {
    const pdfId = file.replace(/\.pdf$/i, '');       
    const filePath = path.join(PDF_DIR, file);

    console.log(`Reading ${file}...`);
    const fullText = await readPdfText(filePath);
    const chunks = chunkText(fullText, CHUNK_SIZE);

    console.log(` - ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      console.log(`   > embedding chunk ${i}`);

      const embedding = await embed(chunkText);

      indexData.push({
        id: `${pdfId}-${i}`,
        pdfId,
        source: file,
        chunkIndex: i,
        text: chunkText,
        embedding
      });
    }
  }

  // Write all chunks to JSON
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ vectors: indexData }, null, 2));
  console.log(`✅ index saved to ${INDEX_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
