// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const chatGptIndex = pc.Index("chat-gpt");

async function createMemory({ vectors, metadata, messageId }) {
  await chatGptIndex.upsert([
    {
      id: messageId,
      values: vectors,
      metadata: metadata,
    },
  ]);
}

async function queryMemory({ queryVectors, limit = 5, metadata }) {
  const data = await chatGptIndex.query({
    vector: queryVectors,
    topK: limit,
    filter: metadata ? { metadata} : undefined,
    includeMetadata: true,
  });

  return data.matches;
}


module.exports = {
    createMemory,
    queryMemory,
}