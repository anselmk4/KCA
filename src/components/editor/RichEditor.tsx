import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [StarterKit, Heading.configure({ levels: [1, 2, 3] }), Link, Image],
    content: value,
    onUpdate({ editor }: { editor: any }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: true });
    }
  }, [value, editor]);

  return (
    <div className="border rounded-md p-3 bg-white dark:bg-zinc-800">
      <EditorContent editor={editor} placeholder={placeholder ?? "Commencez à écrire..."} />
    </div>
  );
};

export default RichEditor;
