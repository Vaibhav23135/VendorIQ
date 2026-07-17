import { Module } from '@nitrostack/core';
import { DatabaseService } from './database.service.js';
import { SeedService } from './seed.service.js';

@Module({
  name: 'database',
  description: 'MongoDB connection + seed data for VendorIQ',
  providers: [DatabaseService, SeedService],
  exports: [DatabaseService, SeedService],
})
export class DatabaseModule {}
