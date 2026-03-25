import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  IAddSpaceMember,
  IChangeSpaceMemberRole,
  IRemoveSpaceMember,
  ISpace,
} from "@/features/space/types/space.types";
import {
  addSpaceMember,
  changeMemberRole,
  getSpaceById,
  getSpaceMembers,
  getSpaces,
  removeSpaceMember,
  createSpace,
  updateSpace,
  deleteSpace,
} from "@/features/space/services/space-service.ts";
import { notifications } from "@mantine/notifications";
import { IPagination, QueryParams } from "@/lib/types.ts";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/main.tsx";
import { getRecentChanges } from "@/features/page/services/page-service.ts";
import { useEffect } from "react";
import { validate as isValidUuid } from "uuid";
import usePermission from "@/hooks/use-permission";
import { filterClientAllowedSpaces } from "@/features/zeaatlas/client-mode/client-mode.utils";

export function useGetSpacesQuery(
  params?: QueryParams,
): UseQueryResult<IPagination<ISpace>, Error> {
  const permission = usePermission();

  return useQuery({
    queryKey: ["spaces", params, permission.isClient],
    queryFn: async () => {
      const data = await getSpaces(params);

      return {
        ...data,
        items: filterClientAllowedSpaces(data.items, permission.isClient),
      };
    },
    placeholderData: keepPreviousData,
    refetchOnMount: true,
  });
}

export function useSpaceQuery(spaceId: string): UseQueryResult<ISpace, Error> {
  const query = useQuery({
    queryKey: ["space", spaceId],
    queryFn: () => getSpaceById(spaceId),
    enabled: !!spaceId,
  });

  useEffect(() => {
    if (query.data) {
      if (isValidUuid(spaceId)) {
        queryClient.setQueryData(["space", query.data.slug], query.data);
      } else {
        queryClient.setQueryData(["space", query.data.id], query.data);
      }
    }
  }, [query.data, spaceId]);

  return query;
}

export const prefetchSpace = (spaceSlug: string, spaceId?: string) => {
  queryClient.prefetchQuery({
    queryKey: ["space", spaceSlug],
    queryFn: () => getSpaceById(spaceSlug),
  });

  if (spaceId) {
    queryClient.prefetchQuery({
      queryKey: ["recent-changes", spaceId],
      queryFn: () => getRecentChanges(spaceId),
    });
  }
};

export function useCreateSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ISpace, Error, Partial<ISpace>>({
    mutationFn: (data) => createSpace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["spaces"],
      });
      notifications.show({ message: t("Space created successfully") });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useGetSpaceBySlugQuery(
  spaceId: string,
): UseQueryResult<ISpace, Error> {
  const permission = usePermission();

  return useQuery({
    queryKey: ["space", spaceId, permission.isClient],
    queryFn: async () => {
      const space = await getSpaceById(spaceId);

      if (permission.isClient && !space?.isClientAllowed) {
        throw Object.assign(new Error("Space access denied"), { status: 403 });
      }

      return space;
    },
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ISpace, Error, Partial<ISpace>>({
    mutationFn: (data) => updateSpace(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Space updated successfully") });

      const space = queryClient.getQueryData([
        "space",
        variables.spaceId,
      ]) as ISpace;
      if (space) {
        const updatedSpace = { ...space, ...data };
        queryClient.setQueryData(["space", variables.spaceId], updatedSpace);
        queryClient.setQueryData(["space", data.slug], updatedSpace);
      }

      queryClient.invalidateQueries({
        queryKey: ["spaces"],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useDeleteSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<ISpace>) => deleteSpace(data.id),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Space deleted successfully") });

      if (variables.slug) {
        queryClient.removeQueries({
          queryKey: ["space", variables.slug],
          exact: true,
        });
      }

      if (variables.id) {
        queryClient.removeQueries({
          queryKey: ["space", variables.id],
          exact: true,
        });

        queryClient.invalidateQueries({
          queryKey: ["recent-changes"],
        });

        queryClient.invalidateQueries({
          queryKey: ["recent-changes", variables.id],
        });
      }

      queryClient.invalidateQueries({
        predicate: (item) => ["spaces"].includes(item.queryKey[0] as string),
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useSpaceMembersInfiniteQuery(
  spaceId: string,
  query?: string,
) {
  return useInfiniteQuery({
    queryKey: ["spaceMembers", spaceId, query],
    queryFn: ({ pageParam }) =>
      getSpaceMembers(spaceId, { cursor: pageParam, limit: 50, query }),
    enabled: !!spaceId,
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
  });
}

export function useAddSpaceMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IAddSpaceMember>({
    mutationFn: (data) => addSpaceMember(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Members added successfully") });
      queryClient.invalidateQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useRemoveSpaceMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IRemoveSpaceMember>({
    mutationFn: (data) => removeSpaceMember(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Member removed successfully") });
      queryClient.invalidateQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useChangeSpaceMemberRoleMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IChangeSpaceMemberRole>({
    mutationFn: (data) => changeMemberRole(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Member role updated successfully") });
      queryClient.refetchQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}
