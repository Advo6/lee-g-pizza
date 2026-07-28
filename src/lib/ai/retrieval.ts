import { buildKnowledgeIndex } from "./knowledge";
import { embedTexts, hashKnowledge, rankChunksBySimilarity } from "./embeddings";
import type { KnowledgeChunk } from "./types";

let cachedChunks: KnowledgeChunk[] | null = null;
let cachedHash = "";
let indexedAt = 0;
const INDEX_TTL_MS = 5 * 60 * 1000;

async function ensureIndexed(): Promise<KnowledgeChunk[]> {
  const fresh = await buildKnowledgeIndex();
  const hash = hashKnowledge(fresh);
  const stale = !cachedChunks || hash !== cachedHash || Date.now() - indexedAt > INDEX_TTL_MS;

  if (stale) {
    cachedChunks = fresh;
    cachedHash = hash;
    indexedAt = Date.now();

    const embeddings = await embedTexts(fresh.map((c) => `${c.title}\n${c.text}`));
    if (embeddings.length === fresh.length) {
      cachedChunks = fresh.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
    }
  }

  return cachedChunks!;
}

export async function retrieveContext(query: string, topK = 6): Promise<string> {
  const chunks = await ensureIndexed();
  const matches = await rankChunksBySimilarity(query, chunks, topK);

  if (!matches.length) {
    return "No specific knowledge chunks matched. Use tools to search the live menu.";
  }

  return matches
    .map(
      (c, i) =>
        `[${i + 1}] (${c.type}) ${c.title}\n${c.text}\nTags: ${c.tags.join(", ")}`
    )
    .join("\n\n");
}

export async function searchKnowledge(
  query: string,
  type?: KnowledgeChunk["type"],
  topK = 5
): Promise<KnowledgeChunk[]> {
  const chunks = await ensureIndexed();
  const filtered = type ? chunks.filter((c) => c.type === type) : chunks;
  return rankChunksBySimilarity(query, filtered, topK);
}

export async function refreshKnowledgeIndex(): Promise<number> {
  cachedChunks = null;
  const chunks = await ensureIndexed();
  return chunks.length;
}
