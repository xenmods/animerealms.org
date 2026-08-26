"use client";

import { JsonViewer } from "@textea/json-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "lucide-react";

export default function AdvancedJsonEditor({
  content,
  onContentChange,
}: {
  content: any;
  onContentChange: (content: any) => void;
}) {
  const handleEdit = (path: string[], value: any) => {
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onContentChange(newContent);
  };

  const handleDelete = (path: string[]) => {
    const newContent = { ...content };
    let current = newContent;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    delete current[path[path.length - 1]];
    onContentChange(newContent);
  };

  return (
    <JsonViewer
      value={content}
      theme="dark"
      editable
      onEdit={({ path, newValue }) => handleEdit(path as string[], newValue)}
      onDelete={({ path }) => handleDelete(path as string[])}
    />
  );
}
