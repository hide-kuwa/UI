"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type BuilderNodeType = "text" | "button";

export interface BuilderNode {
  readonly id: string;
  readonly type: BuilderNodeType;
  readonly name: string;
}

interface BuilderContextValue {
  readonly nodes: ReadonlyArray<BuilderNode>;
  readonly selectedId: string | null;
  readonly addNode: (type: BuilderNodeType) => BuilderNode;
  readonly renameNode: (id: string, name: string) => void;
  readonly selectNode: (id: string | null) => void;
  readonly attachNodeNameInput: (input: HTMLInputElement | null) => void;
  readonly focusNodeNameInput: () => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

const buildNodeName = (type: BuilderNodeType, index: number) => {
  const label = type === "text" ? "Text" : "Button";
  return `${label} ${index}`;
};

const useNodesState = () => {
  const [nodes, setNodes] = useState<ReadonlyArray<BuilderNode>>([]);
  const renameNode = useCallback((id: string, name: string) => {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, name } : node)));
  }, []);
  return { nodes, setNodes, renameNode } as const;
};

const useSelectionState = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);
  return { selectedId, selectNode } as const;
};

const useNodeNameInputHandle = () => {
  const nodeNameInputRef = useRef<HTMLInputElement | null>(null);
  const attachNodeNameInput = useCallback((input: HTMLInputElement | null) => {
    nodeNameInputRef.current = input;
  }, []);
  const focusNodeNameInput = useCallback(() => {
    const input = nodeNameInputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }, []);
  return { attachNodeNameInput, focusNodeNameInput } as const;
};

const useBuilderProviderValue = (): BuilderContextValue => {
  const { nodes, setNodes, renameNode } = useNodesState();
  const { selectedId, selectNode } = useSelectionState();
  const { attachNodeNameInput, focusNodeNameInput } = useNodeNameInputHandle();
  const addNode = useCallback((type: BuilderNodeType) => {
    const index = nodes.filter((node) => node.type === type).length + 1;
    const node: BuilderNode = {
      id: crypto.randomUUID(),
      type,
      name: buildNodeName(type, index),
    };
    setNodes((current) => [...current, node]);
    selectNode(node.id);
    return node;
  }, [nodes, selectNode, setNodes]);
  return useMemo(
    () => ({
      nodes,
      selectedId,
      addNode,
      renameNode,
      selectNode,
      attachNodeNameInput,
      focusNodeNameInput,
    }),
    [nodes, selectedId, addNode, renameNode, selectNode, attachNodeNameInput, focusNodeNameInput],
  );
};

export const BuilderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const value = useBuilderProviderValue();
  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
};

export const useBuilder = (): BuilderContextValue => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};
