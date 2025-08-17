# RAG API

An easy to run Retrieval-Augmented Generation (RAG) implementation that allows you to ask technical questions about the content found in a set of PDF documents.

The goal of this solution was to keep the code **modular**, **clean**, and **easy to test**, with minimal setup for the reviewers.  
All embeddings and chunks are precomputed and stored as JSON files, so the API can be started and tested immediately without any local preprocessing or database setup.

---

## 📑 Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Example Questions & Comments](#example-questions--comments)
- [Architecture Overview](#architecture-overview)
- [RAG Flow](#rag-flow)
- [Notes](#notes)

---

## Features

- Retrieval based on **OpenAI embeddings** and **cosine similarity**
- RAG pipeline organized behind a **Facade** pattern (`RAGFacade`)
- Threshold-based filtering to avoid hallucinations / irrelevant chunks
- Clear system message to force the LLM to stay grounded in the retrieved content
- **Swagger UI** included (`/api-docs`) to test directly from the browser
- Precomputed JSON index → no need for manual chunking / embedding at startup

---

## Requirements

- Node.js ≥ 18  
- OpenAI API Key  

---

## Environment Variables

Create a `.env` file in the project root refering to `.env.example`:

OPENAI_API_KEY=sk-********************************

## Getting Started

```bash
npm install
npm run dev                  # start the API in dev mode
```

*The precomputed JSON index (~25 MB) is included in the repository, so reviewers don’t need to run any preprocessing or use their own API tokens for document embedding, only for the runtime question embedding.*

Open:
<http://localhost:3000/api-docs>

Use “Try it out” to test the /ask endpoint.

or simply send a `POST` request directly to:
<http://localhost:3000/ask> (e.g. with Postman, curl, or any HTTP client).

Example request:

```bash
{
  "question": "How do I change the Xenon lamp module on the Pentero?"
}
```

## Example Questions & Comments

| Question                                                                                               | Result                                                                                                           | Reviewer Comment                                                            |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |------------------------------------------------------------------------------|
| How do I replace the xenon lamp module on the Pentero, and what safety precautions must be followed?   | Full step-by-step procedure + all safety warnings                                                                | ✅ Correct, complete and grounded                                            |
| What is the weight of the stereo coobservation module for the Pentero?                                 | “The weight is 1.0 kg.”                                                                                          | ✅ Correct value, taken from accessories table                               |
| What Wi-Fi antenna does the Pentero microscope use?                                                    | “This information is not available in the provided documentation.”                                              | ✅ Correct refusal (no such info in documentation)                           |
| Before turning on the Centurion Vision System, what should be checked or done?                         | List of all pre-surgery checks and setup instructions                                                            | ✅ Comprehensive retrieval of relevant entries                               |
| What does the EQUIMAT device measure?                                                                  | Description of volume difference display + volume difference flow display operating modes                        | ✅ Correct grounding to retrieved technical description                      |
| What is the software version of the Karl Storz endoscope?                                              | “This information is not available in the provided documentation.”                                              | ✅ Correct refusal (no explicit software version mentioned)                  |
| What is the weight of the accessory named 180° tiltable tube of Pentero?                               | The weight of the accessory named 180° tiltable tube of Pentero is 1.1 kg.                      | ✅ Correct, full and precise value pulled from the accessories section       |

## Architecture Overview

- **assets/**
  - **index/** → precomputed chunk embeddings (`index.json`)
- **src/**
  - **adapters/** → OpenAI client, embedder, index loaders
  - **core/** → Retrieval, Answer builder, RAGFacade (facade pattern)
  - **app/** → `server.ts` (Express + Swagger)
- **swagger.yaml** → OpenAPI spec for `/ask` endpoint

## RAG Flow

1. **Embed the user question**  
   → The question text is converted into a 1536-dimensional embedding using the OpenAI embedding model.

2. **Retrieve the most similar chunks**  
   → The question embedding is compared against all precomputed document embeddings using cosine similarity, and the top **K** chunks are selected.

3. **Filter out chunks *below* the similarity threshold**  
   → Any chunk whose similarity score is **lower than `simThreshold`** is discarded, to avoid answering from weak or unrelated content.

4. **Combine the remaining chunks**  
   → The selected chunks (ordered by similarity score) are concatenated into a single “retrieved content” string.  
   → Each chunk is prefixed with its **cosine score** and separated with a clear delimiter, so the LLM understands it is dealing with *multiple ranked excerpts* (e.g. `"[Chunk 1 – score: 0.87] …  [Chunk 2 – score: 0.76] …"`).

5. **Ask the LLM**  
   → The question + retrieved content are passed to OpenAI Chat with a strict system prompt instructing the assistant to use **only** the retrieved content (no external knowledge, no summarization).

6. **Return the final answer + citations**  
   → The LLM answer is returned along with the source PDF name and chunk index for each chunk that was used (traceability).

## Notes

`simThreshold` and `topK` parameters can be tuned in config/app.ts

The system prompt explicitly instructs the LLM to avoid summarization and to remain fully grounded in the retrieved content

Using precomputed JSON ensures reviewers can test the app without any manual preprocessing
