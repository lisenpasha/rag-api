import express from 'express';
import { APP_CONFIG } from '../../config/app';
import { StaticJsonIndex } from '../adapters/indexStore/StaticJsonIndex';
import { OpenAIEmbedder } from '../adapters/embedder/OpenAIEmbedder';
import { OpenAIChat } from '../adapters/llm/OpenAIChat';
import { Retrieval } from '../core/rag/Retrieval';
import { RAGFacade } from '../core/rag/RAGFacade';

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// 1) Load precomputed index (chunks + embeddings)
const index = new StaticJsonIndex(APP_CONFIG.indexPath);
index.load();

// 2) Prepare services
const retrieval = new Retrieval(index.all());
const embedder = new OpenAIEmbedder();
const llm = new OpenAIChat();
const rag = new RAGFacade(retrieval, embedder, llm);

async function bootstrap() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  /**
   * POST /ask
   * {
   *   "question": "your question"
   * }
   */
  app.post('/ask', async (req, res) => {
    const question = String(req.body?.question ?? '').trim();
    if (!question) {
      return res.status(400).json({ message: 'Missing "question" field' });
    }

    const result = await rag.ask(question);
    return res.status(result.status).json(result?.body);
  });

  /**
   * Swagger UI available at /api-docs
   */
  const swaggerDocument = YAML.load('swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(APP_CONFIG.port, () => {
    console.log(`[RAG] server running on http://localhost:${APP_CONFIG.port}`);
    console.log(`Swagger UI available at http://localhost:${APP_CONFIG.port}/api-docs`);
  });
}

bootstrap();
