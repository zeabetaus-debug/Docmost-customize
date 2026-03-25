import { useMutation } from "@tanstack/react-query";
import {
  approveChangeRequest,
  rejectChangeRequest,
} from "@/features/zeaatlas/change-request/change-request.service";
import { notifications } from "@mantine/notifications";
import { queryClient } from "@/main";

export function useApproveChangeRequestMutation(pageId?: string) {
  return useMutation({
    mutationFn: (id: string) => approveChangeRequest(id),
    onSuccess: async () => {
      notifications.show({
        message: "Change request approved",
        color: "green",
      });

      if (pageId) {
        await queryClient.invalidateQueries({ queryKey: ["pages", pageId] });
      }
    },
    onError: (error) => {
      console.error("Approve change request error:", error);
      notifications.show({
        message: "Failed to approve change request",
        color: "red",
      });
    },
  });
}

export function useRejectChangeRequestMutation() {
  return useMutation({
    mutationFn: (id: string) => rejectChangeRequest(id),
    onSuccess: () => {
      notifications.show({
        message: "Change request rejected",
        color: "red",
      });
    },
    onError: (error) => {
      console.error("Reject change request error:", error);
      notifications.show({
        message: "Failed to reject change request",
        color: "red",
      });
    },
  });
}
