#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script completely resets the MongoDB database by dropping all collections.
 * Use this when you want to start fresh with a clean database.
 * 
 * Usage: node scripts/reset-database.js
 * Or: npm run reset-db
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    try {
      const envPath = join(process.cwd(), envFile);
      const content = readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch (err) {
      // File doesn't exist, skip
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Error: MONGODB_URI environment variable is not set.');
  console.error('   Please set it in your .env or .env.local file');
  process.exit(1);
}

async function resetDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db();
    const dbName = db.databaseName;
    
    console.log(`\n📊 Database: ${dbName}`);
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.length === 0) {
      console.log('ℹ️  No collections found. Database is already empty.');
      await client.close();
      return;
    }

    console.log(`\n📋 Found ${collectionNames.length} collection(s):`);
    collectionNames.forEach(name => console.log(`   - ${name}`));

    console.log('\n🗑️  Dropping all collections...');
    
    // Drop each collection
    for (const collectionName of collectionNames) {
      try {
        await db.collection(collectionName).drop();
        console.log(`   ✅ Dropped: ${collectionName}`);
      } catch (err) {
        // Some collections might not exist or might be system collections
        if (err.codeName === 'NamespaceNotFound') {
          console.log(`   ⚠️  Skipped: ${collectionName} (not found)`);
        } else {
          console.log(`   ❌ Error dropping ${collectionName}:`, err.message);
        }
      }
    }

    // Verify all collections are gone
    const remainingCollections = await db.listCollections().toArray();
    const remainingNames = remainingCollections.map(c => c.name);
    
    if (remainingNames.length === 0) {
      console.log('\n✅ Database reset complete! All collections have been removed.');
      console.log('\n📝 Next steps:');
      console.log('   1. Start your application: npm run dev');
      console.log('   2. Sign up a new user - collections will be created automatically');
      console.log('   3. Create products, make payments, etc. - everything will work fresh!');
    } else {
      console.log('\n⚠️  Warning: Some collections could not be dropped:');
      remainingNames.forEach(name => console.log(`   - ${name}`));
      console.log('\n   These might be system collections. You can manually drop them if needed.');
    }

  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Run the reset
resetDatabase();

