import { Button, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconFileSpreadsheet, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SheetItem {
  id: string;
  name: string;
}

const SHEETS: SheetItem[] = [
  { id: "sheet-1", name: "Sheet 1" },
  { id: "sheet-2", name: "Sheet 2" },
  { id: "sheet-3", name: "Sheet 3" },
];

export default function Sheets() {
  const navigate = useNavigate();
  const [activeSheetId, setActiveSheetId] = useState<string>(SHEETS[0].id);
  const [hoveredSheetId, setHoveredSheetId] = useState<string | null>(null);

  const openSheet = (sheetId: string) => {
    setActiveSheetId(sheetId);
    navigate("/excel");
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title order={2}>Sheets</Title>
        <Button leftSection={<IconPlus size={16} />} variant="light">
          + New Sheet
        </Button>
      </Group>

      <Stack gap="sm">
        {SHEETS.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isHovered = sheet.id === hoveredSheetId;

          return (
            <Paper
              key={sheet.id}
              withBorder
              p="md"
              radius="md"
              component="button"
              type="button"
              onClick={() => openSheet(sheet.id)}
              onMouseEnter={() => setHoveredSheetId(sheet.id)}
              onMouseLeave={() => setHoveredSheetId(null)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                transition: "background-color 150ms ease, border-color 150ms ease",
                backgroundColor: isActive
                  ? "var(--mantine-color-blue-light)"
                  : isHovered
                    ? "var(--mantine-color-gray-0)"
                    : undefined,
                borderColor: isActive
                  ? "var(--mantine-color-blue-5)"
                  : undefined,
              }}
            >
              <Group gap="sm">
                <IconFileSpreadsheet size={18} />
                <Text fw={600}>{sheet.name}</Text>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
