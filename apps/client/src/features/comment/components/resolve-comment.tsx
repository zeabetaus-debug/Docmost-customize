import React from "react";
import { Button, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useResolveCommentMutation } from "@/features/comment/queries/comment-query";

interface ResolveProps {
  editor?: any;
  commentId: string;
  pageId: string;
  resolvedAt?: string | Date | null;
}

export default function ResolveComment({ commentId, pageId, resolvedAt }: ResolveProps) {
  const { t } = useTranslation();
  const resolveMutation = useResolveCommentMutation();

  const handleClick = async () => {
    try {
      await resolveMutation.mutateAsync({ commentId, pageId, resolved: !(resolvedAt != null) });
    } catch (err) {
      // swallow - notifications handled in mutation
    }
  };

  return (
    <Tooltip label={resolvedAt ? t("Unresolve") : t("Resolve")} position="left">
      <Button size="xs" variant="subtle" onClick={handleClick}>
        {resolvedAt ? t("Unresolve") : t("Resolve")}
      </Button>
    </Tooltip>
  );
}
