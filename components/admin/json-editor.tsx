"use client";

import JSONInput from "react-json-editor-ajrm";
import { dark_theme } from "react-json-editor-ajrm/themes";

export default function JsonEditor({
  content,
  onContentChange,
}: {
  content: any;
  onContentChange: (content: any) => void;
}) {
  return (
    <JSONInput
      placeholder={content}
      theme={dark_theme}
      onChange={(e: any) => onContentChange(e.jsObject)}
      height="550px"
      width="100%"
    />
  );
}
