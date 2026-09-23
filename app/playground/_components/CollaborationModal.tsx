'use client';

import React, { useState } from 'react';
import {
  Users,
  Share2,
  Copy,
  MessageSquare,
  CheckCircle2,
  X,
  Send,
  UserPlus,
} from 'lucide-react';
import {
  DEMO_TEAMMATES,
  DEMO_COMMENTS,
  Teammate,
  CommentThread,
  generateRoomShareUrl,
  addCommentThread,
} from '@/lib/collaborationEngine';

interface CollaborationModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaborationModal({
  isOpen,
  onClose,
}: CollaborationModalProps) {
  const [teammates] = useState<Teammate[]>(DEMO_TEAMMATES);
  const [comments, setComments] = useState<CommentThread[]>(DEMO_COMMENTS);
  const [shareUrl] = useState<string>(generateRoomShareUrl());
  const [copied, setCopied] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedFile, setSelectedFile] = useState('index.html');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostComment = () => {
    if (!newCommentText.trim()) return;
    const updated = addCommentThread(comments, selectedFile, newCommentText);
    setComments(updated);
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Multiplayer Real-Time Collaboration System
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                  Phase 17
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Figma-style live teammate presence, real-time room sharing links, and inline comment threads.
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
          {/* Active Teammates Roster */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto">
            {/* Invite Room Box */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share Live Room Link
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Teammates ({teammates.length})</span>
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              </h3>

              <div className="space-y-2">
                {teammates.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white bg-slate-800"
                          style={{ borderColor: member.color }}
                        >
                          {member.name[0]}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            member.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{member.name}</span>
                        <span className="text-[10px] text-slate-400 block">{member.currentLocation}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comment Threads Panel */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {/* New Comment Creator */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" /> Post Teammate Comment Thread
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target File:</span>
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                >
                  <option value="index.html">index.html</option>
                  <option value="app/api/contact/route.ts">app/api/contact/route.ts</option>
                  <option value="lib/stripeClient.ts">lib/stripeClient.ts</option>
                </select>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type feedback comment for team..."
                  rows={2}
                  className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handlePostComment}
                  className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition shrink-0"
                >
                  <Send className="w-4 h-4" /> Post
                </button>
              </div>
            </div>

            {/* Comment Threads List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300">Live Team Discussion Threads ({comments.length})</h4>

              <div className="space-y-3">
                {comments.map((thread) => (
                  <div key={thread.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{thread.author}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-blue-400">
                          {thread.targetFile}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{thread.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-300">{thread.text}</p>

                    {/* Replies */}
                    {thread.replies.length > 0 && (
                      <div className="pt-2 pl-4 border-l-2 border-slate-800 space-y-2">
                        {thread.replies.map((reply, rIdx) => (
                          <div key={rIdx} className="space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-200">{reply.author}</span>
                              <span className="text-[10px] text-slate-500">{reply.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-400">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
