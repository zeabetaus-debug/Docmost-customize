import React from "react";
import { Switch } from "@mantine/core";

export default function SpacePublicSharingToggle({ space }: { space: any }) {
  return <Switch checked={!!space?.public} />;
}
