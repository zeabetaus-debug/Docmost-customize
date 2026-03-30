import { Switch, Group, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { clientModeAtom } from "@/store/client-store";
import { useEffect, useRef, useState } from "react";

const USER_ID = "019d3dab-b64a-7204-b32e-0bf82589710b";

export default function ClientModeToggle() {
  const [enabled, setEnabled] = useAtom(clientModeAtom);
  const [loading, setLoading] = useState(false);

  const hasLoaded = useRef(false); // 🔥 prevents reset

  // ✅ LOAD ONLY ONCE
  useEffect(() => {
    if (hasLoaded.current) return;

    const load = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/client-mode?userId=${USER_ID}`
        );

        const json = await res.json();

        const value =
          json?.data?.client_mode ??
          json?.data?.data?.client_mode ??
          false;

        setEnabled(value);
        hasLoaded.current = true; // ✅ STOP future override
      } catch (err) {
        console.error("Load error", err);
      }
    };

    load();
  }, [setEnabled]);

  // ✅ TOGGLE HANDLER
  const handleToggle = async (value: boolean) => {
    setEnabled(value); // instant UI

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/api/client-mode?userId=${USER_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        }
      );

      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      console.error("Update failed", err);

      // rollback
      setEnabled(!value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group justify="space-between" style={{ width: "100%" }}>
      <Text size="sm" c={enabled ? "green" : "red"}>
        {enabled ? "Client Mode ON" : "Client Mode OFF"}
      </Text>

      <Switch
        checked={enabled}
        onChange={(e) => handleToggle(e.currentTarget.checked)}
        disabled={loading}
        color="green"
      />
    </Group>
  );
}