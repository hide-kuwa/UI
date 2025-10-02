"use client";

import { useEffect } from "react";
import { BuilderNodeType, useBuilder } from "./builderContext";

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  if (target.isContentEditable) {
    return true;
  }
  return tagName === "input" || tagName === "textarea" || tagName === "select";
};

const toNodeType = (key: string): BuilderNodeType | null => {
  if (key === "t") {
    return "text";
  }
  if (key === "b") {
    return "button";
  }
  return null;
};

const useGlobalNodeShortcuts = () => {
  const { addNode, focusNodeNameInput } = useBuilder();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }
      const nodeType = toNodeType(event.key.toLowerCase());
      if (!nodeType) {
        return;
      }
      addNode(nodeType);
      focusNodeNameInput();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addNode, focusNodeNameInput]);
};

export const HeaderBar: React.FC = () => {
  useGlobalNodeShortcuts();
  return (
    <header className="header-bar">
      <h1>Builder Mini</h1>
    </header>
  );
};
