import mongoose from "mongoose";

const cached = global.mongoose || (global.mongoose = { conn: null, promise: null });
export const mongoConnectionOptions = {
  // Models can be registered while Next.js loads route chunks during connection.
  // Let collection/index initialization wait for that connection, with a hard cap.
  bufferCommands: true,
  bufferTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
};

export async function dbConnect() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  if (cached.conn && mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }
  if (!process.env.MONGODB_URI) throw new Error("Database configuration is missing.");
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, mongoConnectionOptions);
  }
  
	try {
  	    cached.conn = await cached.promise;

  	    

      return cached.conn;
     }


    catch {
    cached.conn = null;
    cached.promise = null;
    throw new Error("Database connection unavailable.");
  }
}
