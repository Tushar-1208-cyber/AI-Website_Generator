'use client';

import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Zap,
  Table,
  FileCode,
} from 'lucide-react';
import {
  DEFAULT_DATABASE_SCHEMA,
  TableDef,
  ColumnDef,
  generatePrismaSchema,
  generateDrizzleSchema,
  injectDatabaseSchema,
} from '@/lib/aiDatabaseEngine';

interface DatabaseStudioModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (updatedFilesMap: Record<string, string>, addedPath: string) => void;
}

export default function DatabaseStudioModal({
  filesMap,
  isOpen,
  onClose,
  onApplySchema,
}: DatabaseStudioModalProps) {
  const [tables, setTables] = useState<TableDef[]>(DEFAULT_DATABASE_SCHEMA);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number>(0);
  const [ormFormat, setOrmFormat] = useState<'prisma' | 'drizzle'>('prisma');
  const [newTableName, setNewTableName] = useState('');
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTable = tables[selectedTableIndex] || tables[0];

  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    const name = newTableName.trim().replace(/\s+/g, '');
    const newTable: TableDef = {
      name,
      description: `Custom ${name} data entity`,
      columns: [
        { name: 'id', type: 'String', isPrimary: true, defaultVal: 'cuid()' },
        { name: 'createdAt', type: 'DateTime', defaultVal: 'now()' },
      ],
    };
    setTables([...tables, newTable]);
    setSelectedTableIndex(tables.length);
    setNewTableName('');
  };

  const handleAddColumn = () => {
    if (!currentTable) return;
    const newCol: ColumnDef = {
      name: `field_${currentTable.columns.length + 1}`,
      type: 'String',
      isNullable: true,
    };
    const updatedTables = [...tables];
    updatedTables[selectedTableIndex].columns.push(newCol);
    setTables(updatedTables);
  };

  const handleDeleteColumn = (colIndex: number) => {
    const updatedTables = [...tables];
    updatedTables[selectedTableIndex].columns.splice(colIndex, 1);
    setTables(updatedTables);
  };

  const handleInject = () => {
    const updatedMap = injectDatabaseSchema(filesMap, tables, ormFormat);
    const addedPath = ormFormat === 'prisma' ? 'prisma/schema.prisma' : 'db/schema.ts';
    onApplySchema(updatedMap, addedPath);
    setInjectedSuccess(`Successfully injected ${ormFormat.toUpperCase()} Schema file (\`${addedPath}\`)!`);
  };

  const activeSchemaCode =
    ormFormat === 'prisma' ? generatePrismaSchema(tables) : generateDrizzleSchema(tables);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Visual Database Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                  Phase 13
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visually design relational database schemas and export Prisma ORM & Drizzle ORM models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Tables Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Database Tables ({tables.length})
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New table name..."
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddTable}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {tables.map((tbl, idx) => (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTableIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    selectedTableIndex === idx
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">{tbl.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {tbl.columns.length} cols
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Column Editor & ORM Code */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {injectedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{injectedSuccess}</span>
              </div>
            )}

            {/* ORM Exporter Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setOrmFormat('prisma')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ormFormat === 'prisma' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Prisma ORM
                </button>
                <button
                  onClick={() => setOrmFormat('drizzle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ormFormat === 'drizzle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Drizzle ORM
                </button>
              </div>

              <button
                onClick={handleInject}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-600/20"
              >
                <Zap className="w-4 h-4" /> Inject {ormFormat.toUpperCase()} Schema
              </button>
            </div>

            {/* Table Columns Editor */}
            {currentTable && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-400" /> Editing Table: <code>{currentTable.name}</code>
                  </h4>
                  <button
                    onClick={handleAddColumn}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-cyan-300 rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="space-y-2">
                  {currentTable.columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => {
                          const updated = [...tables];
                          updated[selectedTableIndex].columns[cIdx].name = e.target.value;
                          setTables(updated);
                        }}
                        className="w-1/3 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white font-mono text-xs"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const updated = [...tables];
                          updated[selectedTableIndex].columns[cIdx].type = e.target.value as ColumnDef['type'];
                          setTables(updated);
                        }}
                        className="w-1/3 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs"
                      >
                        <option value="String">String</option>
                        <option value="Int">Int</option>
                        <option value="Boolean">Boolean</option>
                        <option value="DateTime">DateTime</option>
                        <option value="Json">Json</option>
                      </select>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-1 justify-end">
                        {col.isPrimary && <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">PK</span>}
                        {col.isUnique && <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">UQ</span>}
                        {!col.isPrimary && (
                          <button
                            onClick={() => handleDeleteColumn(cIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Code Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" /> Generated ORM Code (`{ormFormat === 'prisma' ? 'prisma/schema.prisma' : 'db/schema.ts'}`)
              </h4>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto max-h-56">
                {activeSchemaCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
