"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdown tidak merender HTML mentah, jadi aman untuk teks dari model.
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: ({ node: _node, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
