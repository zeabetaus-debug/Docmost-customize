import React from "react";
import { Group, ScrollArea, Text } from "@mantine/core";

interface Props {
  original: string;
  proposed: string;
}

function simpleDiffLines(a: string, b: string) {
  const left = a.split("\n");
  const right = b.split("\n");
  const max = Math.max(left.length, right.length);

  return Array.from({ length: max }).map((_, i) => ({
    l: left[i] ?? "",
    r: right[i] ?? "",
    changed: (left[i] ?? "") !== (right[i] ?? ""),
  }));
}

export default function ChangeRequestDiff({ original, proposed }: Props) {
  const rows = simpleDiffLines(original || "", proposed || "");

  return (
    <Group gap="md" style={{ width: "100%" }}>
      {/* ORIGINAL */}
      <div style={{ flex: 1 }}>
        <Text fw={700} mb={8}>
          Original
        </Text>

        <ScrollArea h={360}>
          <div style={{ fontFamily: "monospace" }}>
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  padding: "6px 8px",
                }}
              >
                {r.l || " "}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* GAP */}
      <div style={{ width: 12 }} />

      {/* PROPOSED */}
      <div style={{ flex: 1 }}>
        <Text fw={700} mb={8}>
          Proposed
        </Text>

        <ScrollArea h={360}>
          <div style={{ fontFamily: "monospace" }}>
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  padding: "6px 8px",
                  background: r.changed
                    ? "rgba(0, 200, 120, 0.08)"
                    : "transparent",
                }}
              >
                {r.r || " "}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Group>
  );
}