"use client";

import { ChangeEventHandler, useEffect, useMemo, useRef } from "react";
import { useBuilder } from "./builderContext";

const getNodeName = (nodes: ReturnType<typeof useBuilder>["nodes"], selectedId: string | null) => {
  if (!selectedId) {
    return "";
  }
  const node = nodes.find((item) => item.id === selectedId);
  return node?.name ?? "";
};

const useNodeNameChange = (selectedId: string | null, renameNode: (id: string, name: string) => void) => {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!selectedId) {
      return;
    }
    renameNode(selectedId, event.target.value);
  };
  return handleChange;
};

export const RightPane: React.FC = () => {
  const { nodes, selectedId, renameNode, attachNodeNameInput, focusNodeNameInput } = useBuilder();
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeName = useMemo(() => getNodeName(nodes, selectedId), [nodes, selectedId]);
  const handleChange = useNodeNameChange(selectedId, renameNode);

  useEffect(() => {
    attachNodeNameInput(inputRef.current);
    return () => {
      attachNodeNameInput(null);
    };
  }, [attachNodeNameInput]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    focusNodeNameInput();
  }, [selectedId, focusNodeNameInput]);

  return (
    <aside className="right-pane">
      <label className="node-name">
        <span>ノード名</span>
        <input ref={inputRef} value={nodeName} onChange={handleChange} />
      </label>
    </aside>
  );
};
