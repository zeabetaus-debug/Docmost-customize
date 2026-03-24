import { Group, Text, Indicator, UnstyledButton } from "@mantine/core";
import { useAtom } from "jotai";
import { clientModeAtom } from "@/store/client-store";

export default function ClientModeToggle() {
  const [enabled, setEnabled] = useAtom(clientModeAtom);

  return (
    <UnstyledButton
      onClick={() => setEnabled(!enabled)}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        background: enabled ? "rgba(0,255,0,0.1)" : "transparent",
      }}
    >
      <Group gap={6}>
        <Indicator
          color={enabled ? "green" : "red"}
          size={8}
        >
          <span style={{ fontSize: 12 }}>
            Client Mode
          </span>
        </Indicator>
      </Group>
    </UnstyledButton>
  );
}