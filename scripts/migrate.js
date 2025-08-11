#!/usr/bin/env node

/**
 * Database Migration Script for NeuralHack Cognitive AI
 * Handles database schema updates and data migrations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Check if migration has been applied
 */
async function isMigrationApplied(migrationName) {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .eq('version', migrationName)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    // If schema_migrations table doesn't exist, create it
    if (error.message.includes('relation "schema_migrations" does not exist')) {
      await createMigrationsTable();
      return false;
    }
    throw error;
  }
}

/**
 * Create schema_migrations table
 */
async function createMigrationsTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (error) {
    throw new Error(`Failed to create migrations table: ${error.message}`);
  }

  console.log('✅ Created schema_migrations table');
}

/**
 * Apply a single migration
 */
async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🔄 Applying migration: ${migrationFile}`);

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }

    // Record the migration as applied
    const { error: insertError } = await supabase
      .from('schema_migrations')
      .insert({ version: migrationFile });

    if (insertError) {
      throw new Error(`Failed to record migration: ${insertError.message}`);
    }

    console.log(`✅ Applied migration: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${migrationFile}:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('📝 No migration files found');
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration files`);

  for (const migrationFile of migrationFiles) {
    const isApplied = await isMigrationApplied(migrationFile);

    if (isApplied) {
      console.log(`⏭️ Skipping already applied migration: ${migrationFile}`);
      continue;
    }

    await applyMigration(migrationFile);
  }

  console.log('✅ All migrations completed successfully!');
}

/**
 * Rollback last migration (if needed)
 */
async function rollbackLastMigration() {
  console.log('🔄 Rolling back last migration...');

  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('applied_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ No migrations to rollback');
    return;
  }

  // Note: Rollback logic would need to be implemented based on specific requirements
  console.log(`⚠️ Rollback functionality not implemented for: ${data.version}`);
  console.log('Manual rollback may be required');
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'migrate';

  try {
    switch (command) {
      case 'migrate':
        await runMigrations();
        break;
      case 'rollback':
        await rollbackLastMigration();
        break;
      default:
        console.log('Usage: node migrate.js [migrate|rollback]');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}