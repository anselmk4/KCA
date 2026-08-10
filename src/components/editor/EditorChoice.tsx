import React from "react";

export type EditorMode = "rich" | "plain";

interface EditorChoiceProps {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}

export default function EditorChoice({ mode, setMode }: EditorChoiceProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <label className="font-medium">Éditeur :</label>
      <div className="flex gap-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="editorMode"
            value="rich"
            checked={mode === "rich"}
            onChange={() => setMode("rich")}
            className="mr-1"
          />
          <span>Rich Text</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="editorMode"
            value="plain"
            checked={mode === "plain"}
            onChange={() => setMode("plain")}
            className="mr-1"
          />
          <span>Plain Text</span>
        </label>
      </div>
    </div>
  );
}
