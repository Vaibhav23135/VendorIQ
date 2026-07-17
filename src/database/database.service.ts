import { Injectable, ConfigService, ExecutionContext } from '@nitrostack/core';
import mongoose from 'mongoose';

/**
 * DatabaseService
 *
 * Owns the single Mongoose connection to the `VendorIQ` MongoDB database.
 * Connects lazily on first use and is safe to call `connect()` multiple times.
 */
@Injectable({ deps: [ConfigService] })
export class DatabaseService {
  private connected = false;
  private connectingPromise: Promise<typeof mongoose> | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async connect(): Promise<typeof mongoose> {
    if (this.connected) return mongoose;
    if (this.connectingPromise) return this.connectingPromise;

    const uri = this.config.get<string>('MONGODB_URI');
    if (!uri) {
      throw new Error('MONGODB_URI is not set in environment configuration');
    }

    this.connectingPromise = mongoose
      .connect(uri, { dbName: 'VendorIQ' })
      .then((conn) => {
        this.connected = true;
        return conn;
      })
      .catch((err) => {
        this.connectingPromise = null;
        throw err;
      });

    return this.connectingPromise;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnection(): typeof mongoose {
    return mongoose;
  }
}
