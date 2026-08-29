import { MongoClient } from "mongodb";
import { localDbInstance } from "./local-storage";

const uri = process.env.MONGODB_URI;
let clientPromise: Promise<any>;

if (!uri) {
  // Desktop / offline fallback mode
  clientPromise = Promise.resolve(localDbInstance as any);
} else {
  const options = {};
  let client: MongoClient;

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
}

export default clientPromise;

