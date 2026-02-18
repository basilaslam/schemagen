import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    if (uri) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    } else {
      // Create a never-resolving promise to avoid errors during build
      globalWithMongo._mongoClientPromise = new Promise(() => {});
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  if (uri) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } else {
    // Create a never-resolving promise to avoid errors during build
    clientPromise = new Promise(() => {});
  }
}

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  if (!clientPromise) {
    throw new Error('MongoDB client not initialized');
  }

  const client = await clientPromise;
  return client.db();
}

export default clientPromise;
