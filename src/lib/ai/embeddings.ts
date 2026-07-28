import { createHash } from "crypto";
import { EMBEDDING_MODEL } from "./constants";
import type { KnowledgeChunk } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || texts.length === 0) return [];

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    console.warn("Embedding API failed:", await response.text());
    return [];
  }

  const data = await response.json();
  return (data.data as Array<{ embedding: number[] }>).map((row) => row.embedding);
}

export function lexicalScore(query: string, text: string): number {
  const qTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const hay = text.toLowerCase();
  let score = 0;
  for (const token of qTokens) {
    if (hay.includes(token)) score += 1;
  }
  return score;
}

export async function rankChunksBySimilarity(
  query: string,
  chunks: KnowledgeChunk[],
  topK = 6
): Promise<KnowledgeChunk[]> {
  const queryEmbedding = (await embedTexts([query]))[0];

  const scored = chunks.map((chunk) => {
    let score = lexicalScore(query, chunk.text + " " + chunk.title);
    if (queryEmbedding && chunk.embedding) {
      score += cosineSimilarity(queryEmbedding, chunk.embedding) * 10;
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, topK)
    .map((x) => x.chunk);
}

export function hashKnowledge(chunks: KnowledgeChunk[]): string {
  const payload = chunks.map((c) => `${c.id}:${c.text}`).join("|");
  return createHash("sha256").update(payload).digest("hex");
}
