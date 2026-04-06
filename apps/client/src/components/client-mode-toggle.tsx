import { Switch, Group, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { clientModeAtom, setClientModeAtom } from "@/store/client-store";
import { useState } from "react";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { updateUser } from "@/features/user/services/user-service";

export default function ClientModeToggle() {
  const [clientMode] = useAtom(clientModeAtom);
  const [, setClientMode] = useAtom(setClientModeAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom as any);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (value: boolean) => {
    console.log('ClientMode toggle click', value);
    // optimistic UI
    setClientMode(value);

    try {
      setLoading(true);
      const updated = await updateUser({ clientMode: value } as any);
      console.log('ClientMode API response', updated);

      // update current user atom (merge returned fields)
      if (currentUser && currentUser.user) {
        setCurrentUser({
          ...currentUser,
          user: { ...currentUser.user, ...updated },
        });
      }

      setClientMode(Boolean(updated.clientMode));
      console.log('Final rendered state', Boolean(updated.clientMode));
    } catch (err) {
      console.error('Update failed', err);
      // rollback
      setClientMode(!value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group justify="space-between" style={{ width: "100%" }}>
      <Text size="sm" c={clientMode ? "green" : "red"}>
        {clientMode ? "Client Mode ON" : "Client Mode OFF"}
      </Text>

      <Switch
        checked={clientMode}
        onChange={(e) => handleToggle(e.currentTarget.checked)}
        disabled={loading}
        color="green"
      />
    </Group>
  );
}