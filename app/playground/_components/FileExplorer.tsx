"use client";

import React, { useState } from "react";
import { FileTreeNode, FileType, ProjectFilesMap } from "@/types/types";
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileType as FileTypeIcon,
  FileJson,
  FileText,
  File,
  Plus,
  Trash2,
  Download,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import JSZip from "jszip";

interface FileExplorerProps {
  filesTree: FileTreeNode[];
  filesMap: ProjectFilesMap;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onAddFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  projectName?: string;
}

export default function FileExplorer({
  filesTree,
  filesMap,
  activeFilePath,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  projectName = "project",
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "": true,
    css: true,
    js: true,
    components: true,
    api: true,
  });
  const [newFilePath, setNewFilePath] = useState("");
  const [isAddingFile, setIsAddingFile] = useState(false);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const getIconForFile = (type?: FileType, name?: string) => {
    if (name?.endsWith(".html") || type === "html") {
      return <FileCode2 className="size-4 text-orange-400 shrink-0" />;
    }
    if (name?.endsWith(".css") || type === "css") {
      return <FileTypeIcon className="size-4 text-blue-400 shrink-0" />;
    }
    if (name?.endsWith(".js") || name?.endsWith(".ts") || type === "js" || type === "ts") {
      return <FileCode2 className="size-4 text-yellow-400 shrink-0" />;
    }
    if (name?.endsWith(".json") || type === "json") {
      return <FileJson className="size-4 text-green-400 shrink-0" />;
    }
    if (name?.endsWith(".md") || type === "md") {
      return <FileText className="size-4 text-purple-400 shrink-0" />;
    }
    return <File className="size-4 text-slate-400 shrink-0" />;
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    const cleanPath = newFilePath.trim().replace(/^\/+/, "");
    onAddFile(cleanPath);
    setNewFilePath("");
    setIsAddingFile(false);
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      Object.keys(filesMap).forEach((filePath) => {
        zip.file(filePath, filesMap[filePath]);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip:", err);
    }
  };

  const renderTreeNode = (node: FileTreeNode, depth = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.path] ?? true;
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="size-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="size-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isActive = activeFilePath === node.path;

    return (
      <div
        key={node.path}
        onClick={() => onSelectFile(node.path)}
        className={`group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
          isActive
            ? "bg-blue-600/30 text-blue-300 font-semibold border-l-2 border-blue-500"
            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          {getIconForFile(node.type, node.name)}
          <span className="truncate">{node.name}</span>
        </div>
        {node.path !== "index.html" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete ${node.name}?`)) {
                onDeleteFile(node.path);
              }
            }}
            title="Delete file"
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0">
      {/* Explorer Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAddingFile(true)}
            title="New File"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition-colors"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={handleDownloadZip}
            title="Download ZIP"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition-colors"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>

      {/* Add New File Input */}
      {isAddingFile && (
        <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-slate-800 bg-slate-950/60">
          <input
            type="text"
            placeholder="e.g. css/styles.css"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              type="button"
              onClick={() => setIsAddingFile(false)}
              className="text-[10px] px-2 py-0.5 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filesTree.length === 0 ? (
          <div className="text-xs text-slate-500 p-2 italic">No files generated yet</div>
        ) : (
          filesTree.map((node) => renderTreeNode(node))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 text-center">
        {Object.keys(filesMap).length} file(s) in project
      </div>
    </div>
  );
}
