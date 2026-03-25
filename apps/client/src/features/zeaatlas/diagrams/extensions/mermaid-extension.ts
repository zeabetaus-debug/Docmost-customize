import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MermaidNodeView from "../components/mermaid-node-view";
import { DEFAULT_MERMAID_CODE } from "../utils/mermaid-utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaid: {
      insertMermaid: (code?: string) => ReturnType;
    };
  }
}

export const MermaidNode = Node.create({
  name: "mermaid",

  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  isolating: true,
  whitespace: "pre",

  parseHTML() {
    return [{ tag: "div[data-type='mermaid']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "mermaid" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addCommands() {
    return {
      insertMermaid:
        (code = DEFAULT_MERMAID_CODE) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "text",
                text: code,
              },
            ],
          });
        },
    };
  },
});
