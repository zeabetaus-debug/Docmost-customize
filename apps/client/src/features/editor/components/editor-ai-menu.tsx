import React from "react";
import { Button } from "@mantine/core";

export function EditorAiMenu({ editor }: { editor?: any }) {
  return (
    <div style={{ display: "inline-block" }}>
      <Button size="xs" variant="subtle">AI</Button>
    </div>
  );
}
