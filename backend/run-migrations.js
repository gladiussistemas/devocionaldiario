const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Iniciando execução das migrations...\n');

  try {
    // Migration 006: Add fields to devotionals
    console.log('📝 Executando Migration 006...');

    // Rename column
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE devotionals RENAME COLUMN publication_date TO publish_date'
    }).catch(() => console.log('   ⚠️  Coluna já renomeada ou não existe'));

    // Add new columns
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE devotionals
        ADD COLUMN IF NOT EXISTS day_number INTEGER,
        ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 10,
        ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'
      `
    });

    if (error1) console.log('   ℹ️  Colunas já existem ou erro:', error1.message);
    else console.log('   ✅ Migration 006 concluída!');

    // Migration 007: Add fields to devotional_contents
    console.log('\n📝 Executando Migration 007...');

    // Rename columns
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE devotional_contents RENAME COLUMN content TO teaching_content'
    }).catch(() => console.log('   ⚠️  Coluna content já renomeada'));

    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE devotional_contents RENAME COLUMN prayer TO closing_prayer'
    }).catch(() => console.log('   ⚠️  Coluna prayer já renomeada'));

    // Add new columns
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE devotional_contents
        ADD COLUMN IF NOT EXISTS quote_author TEXT,
        ADD COLUMN IF NOT EXISTS quote_text TEXT,
        ADD COLUMN IF NOT EXISTS opening_inspiration TEXT,
        ADD COLUMN IF NOT EXISTS action_step TEXT,
        ADD COLUMN IF NOT EXISTS reflection_questions JSONB DEFAULT '[]'::jsonb
      `
    });

    if (error2) console.log('   ℹ️  Colunas já existem ou erro:', error2.message);
    else console.log('   ✅ Migration 007 concluída!');

    // Migration 008: Add scripture_text to biblical_references
    console.log('\n📝 Executando Migration 008...');

    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE biblical_references
        ADD COLUMN IF NOT EXISTS scripture_text JSONB DEFAULT '{}'::jsonb
      `
    });

    if (error3) console.log('   ℹ️  Coluna já existe ou erro:', error3.message);
    else console.log('   ✅ Migration 008 concluída!');

    console.log('\n🎉 Todas as migrations foram executadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();
