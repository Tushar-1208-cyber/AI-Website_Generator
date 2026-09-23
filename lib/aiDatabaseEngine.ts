/**
 * AI Visual Database Studio Engine
 * Manages database schemas, visual ER tables, Prisma ORM schema generation,
 * Drizzle ORM schema generation, and SQL migrations.
 */

export interface ColumnDef {
  name: string;
  type: 'String' | 'Int' | 'Boolean' | 'DateTime' | 'Json';
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultVal?: string;
}

export interface TableDef {
  name: string;
  description: string;
  columns: ColumnDef[];
}

export const DEFAULT_DATABASE_SCHEMA: TableDef[] = [
  {
    name: 'User',
    description: 'Registered user accounts & subscription profiles',
    columns: [
      { name: 'id', type: 'String', isPrimary: true, defaultVal: 'cuid()' },
      { name: 'email', type: 'String', isUnique: true },
      { name: 'name', type: 'String', isNullable: true },
      { name: 'stripeCustomerId', type: 'String', isUnique: true, isNullable: true },
      { name: 'createdAt', type: 'DateTime', defaultVal: 'now()' },
    ],
  },
  {
    name: 'Project',
    description: 'AI-generated website & SaaS software projects',
    columns: [
      { name: 'id', type: 'String', isPrimary: true, defaultVal: 'cuid()' },
      { name: 'title', type: 'String' },
      { name: 'slug', type: 'String', isUnique: true },
      { name: 'published', type: 'Boolean', defaultVal: 'false' },
      { name: 'userId', type: 'String' },
      { name: 'createdAt', type: 'DateTime', defaultVal: 'now()' },
    ],
  },
];

/**
 * Generates a Prisma Schema (prisma/schema.prisma) string
 */
export function generatePrismaSchema(tables: TableDef[]): string {
  let schema = `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

  for (const table of tables) {
    schema += `model ${table.name} {\n`;
    for (const col of table.columns) {
      let colType = col.type;
      if (col.type === 'String') colType = 'String';
      if (col.type === 'Int') colType = 'Int';
      if (col.type === 'Boolean') colType = 'Boolean';
      if (col.type === 'DateTime') colType = 'DateTime';
      if (col.type === 'Json') colType = 'Json';

      if (col.isNullable && !col.isPrimary) colType += '?';

      let directives = '';
      if (col.isPrimary) directives += ' @id';
      if (col.isUnique) directives += ' @unique';
      if (col.defaultVal) directives += ` @default(${col.defaultVal})`;

      schema += `  ${col.name.padEnd(16)} ${colType}${directives}\n`;
    }
    schema += `}\n\n`;
  }

  return schema.trim();
}

/**
 * Generates Drizzle ORM Schema (db/schema.ts) string
 */
export function generateDrizzleSchema(tables: TableDef[]): string {
  let code = `import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';\n\n`;

  for (const table of tables) {
    const tableNameLower = table.name.toLowerCase();
    code += `export const ${table.name.toLowerCase()}s = pgTable('${tableNameLower}s', {\n`;
    for (const col of table.columns) {
      let typeFunc = "text('" + col.name + "')";
      if (col.type === 'Int') typeFunc = "integer('" + col.name + "')";
      if (col.type === 'Boolean') typeFunc = "boolean('" + col.name + "')";
      if (col.type === 'DateTime') typeFunc = "timestamp('" + col.name + "')";

      if (col.isPrimary) typeFunc += '.primaryKey()';
      if (col.isUnique) typeFunc += '.unique()';
      if (!col.isNullable) typeFunc += '.notNull()';

      code += `  ${col.name}: ${typeFunc},\n`;
    }
    code += `});\n\n`;
  }

  return code.trim();
}

/**
 * Injects Prisma or Drizzle DB Schema into project filesMap
 */
export function injectDatabaseSchema(
  filesMap: Record<string, string>,
  tables: TableDef[],
  orm: 'prisma' | 'drizzle'
): Record<string, string> {
  const updatedMap = { ...filesMap };

  if (orm === 'prisma') {
    updatedMap['prisma/schema.prisma'] = generatePrismaSchema(tables);
  } else {
    updatedMap['db/schema.ts'] = generateDrizzleSchema(tables);
  }

  const currentEnv = updatedMap['.env.example'] || '# Project Environment Variables\n';
  if (!currentEnv.includes('DATABASE_URL')) {
    updatedMap['.env.example'] = `${currentEnv}\nDATABASE_URL="postgresql://postgres:password@localhost:5432/app_db"\n`;
  }

  return updatedMap;
}
