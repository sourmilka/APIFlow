import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'apiflow';

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Collections
export const COLLECTIONS = {
  SESSIONS: 'parsing_sessions',
  PROXIES: 'proxies',
  LOGS: 'parsing_logs',
  USERS: 'users',
};

// Initialize indexes
export async function initializeIndexes() {
  try {
    const { db } = await connectToDatabase();
    
    // Sessions collection indexes
    await db.collection(COLLECTIONS.SESSIONS).createIndexes([
      { key: { sessionId: 1 }, unique: true },
      { key: { createdAt: 1 }, expireAfterSeconds: 3600 }, // Auto-delete after 1 hour
      { key: { url: 1 } },
    ]);

    // Logs collection indexes
    await db.collection(COLLECTIONS.LOGS).createIndexes([
      { key: { createdAt: 1 }, expireAfterSeconds: 604800 }, // Auto-delete after 7 days
      { key: { sessionId: 1 } },
    ]);

    console.log('✅ MongoDB indexes initialized');
  } catch (error) {
    console.error('❌ Error initializing indexes:', error);
  }
}
