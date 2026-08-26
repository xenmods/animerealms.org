import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mainMongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mainMongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mainMongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mainMongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
