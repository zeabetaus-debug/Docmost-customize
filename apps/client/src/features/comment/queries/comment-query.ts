import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  getPageComments,
  updateComment,
  resolveComment,
} from "@/features/comment/services/comment-service";
import {
  ICommentParams,
  IComment,
  IResolveComment,
} from "@/features/comment/types/comment.types";
import { notifications } from "@mantine/notifications";
import { IPagination } from "@/lib/types.ts";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import usePermission from "@/hooks/use-permission";
import { CLIENT_READ_ONLY_MESSAGE } from "@/features/zeaatlas/client-mode/client-mode.utils";

export const RQ_KEY = (pageId: string) => ["comments", pageId];

export function useCommentsQuery(params: ICommentParams) {
  const query = useInfiniteQuery({
    queryKey: RQ_KEY(params.pageId),
    queryFn: ({ pageParam }) =>
      getPageComments({ pageId: params.pageId, cursor: pageParam, limit: 100 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    enabled: !!params.pageId,
  });

  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const data = useMemo<IPagination<IComment> | undefined>(() => {
    if (!query.data) return undefined;
    return {
      items: query.data.pages.flatMap((p) => p.items),
      meta: query.data.pages[query.data.pages.length - 1].meta,
    };
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading || query.hasNextPage,
    isError: query.isError,
  };
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const permission = usePermission();

  return useMutation<IComment, Error, Partial<IComment>>({
    mutationFn: (data) => {
      if (permission.isClient) {
        throw new Error(CLIENT_READ_ONLY_MESSAGE);
      }

      return createComment(data);
    },
    onSuccess: (newComment) => {
      const cache = queryClient.getQueryData(
        RQ_KEY(newComment.pageId),
      ) as InfiniteData<IPagination<IComment>> | undefined;

      if (cache && cache.pages.length > 0) {
        const lastIdx = cache.pages.length - 1;
        queryClient.setQueryData(RQ_KEY(newComment.pageId), {
          ...cache,
          pages: cache.pages.map((page, i) =>
            i === lastIdx
              ? { ...page, items: [...page.items, newComment] }
              : page,
          ),
        });
      }

      notifications.show({ message: t("Comment created successfully") });
    },
    onError: (error) => {
      notifications.show({
        message:
          error.message === CLIENT_READ_ONLY_MESSAGE
            ? CLIENT_READ_ONLY_MESSAGE
            : t("Error creating comment"),
        color: error.message === CLIENT_READ_ONLY_MESSAGE ? "gray" : "red",
      });
    },
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const permission = usePermission();

  return useMutation<IComment, Error, Partial<IComment>>({
    mutationFn: (data) => {
      if (permission.isClient) {
        throw new Error(CLIENT_READ_ONLY_MESSAGE);
      }

      return updateComment(data);
    },
    onSuccess: (updatedComment) => {
      const cache = queryClient.getQueryData(
        RQ_KEY(updatedComment.pageId),
      ) as InfiniteData<IPagination<IComment>> | undefined;

      if (cache) {
        queryClient.setQueryData(RQ_KEY(updatedComment.pageId), {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.map((comment) =>
              comment.id === updatedComment.id ? updatedComment : comment,
            ),
          })),
        });
      }

      notifications.show({ message: t("Comment updated successfully") });
    },
    onError: (error) => {
      notifications.show({
        message:
          error.message === CLIENT_READ_ONLY_MESSAGE
            ? CLIENT_READ_ONLY_MESSAGE
            : t("Failed to update comment"),
        color: error.message === CLIENT_READ_ONLY_MESSAGE ? "gray" : "red",
      });
    },
  });
}

export function useDeleteCommentMutation(pageId?: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const permission = usePermission();

  return useMutation({
    mutationFn: (commentId: string) => {
      if (permission.isClient) {
        throw new Error(CLIENT_READ_ONLY_MESSAGE);
      }

      return deleteComment(commentId);
    },
    onSuccess: (_data, commentId) => {
      const cache = queryClient.getQueryData(
        RQ_KEY(pageId),
      ) as InfiniteData<IPagination<IComment>> | undefined;

      if (cache) {
        queryClient.setQueryData(RQ_KEY(pageId), {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.filter((comment) => comment.id !== commentId),
          })),
        });
      }

      notifications.show({ message: t("Comment deleted successfully") });
    },
    onError: (error) => {
      notifications.show({
        message:
          error.message === CLIENT_READ_ONLY_MESSAGE
            ? CLIENT_READ_ONLY_MESSAGE
            : t("Failed to delete comment"),
        color: error.message === CLIENT_READ_ONLY_MESSAGE ? "gray" : "red",
      });
    },
  });
}

export function useResolveCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const permission = usePermission();

  return useMutation<IComment, Error, IResolveComment>({
    mutationFn: (data) => {
      if (permission.isClient) {
        throw new Error(CLIENT_READ_ONLY_MESSAGE);
      }

      return resolveComment(data);
    },
    onSuccess: (updatedComment) => {
      const cache = queryClient.getQueryData(
        RQ_KEY(updatedComment.pageId),
      ) as InfiniteData<IPagination<IComment>> | undefined;

      if (cache) {
        queryClient.setQueryData(RQ_KEY(updatedComment.pageId), {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.map((c) =>
              c.id === updatedComment.id ? updatedComment : c,
            ),
          })),
        });
      }

      notifications.show({ message: t("Comment updated successfully") });
    },
    onError: (error) => {
      notifications.show({
        message:
          error.message === CLIENT_READ_ONLY_MESSAGE
            ? CLIENT_READ_ONLY_MESSAGE
            : t("Failed to toggle resolved state"),
        color: error.message === CLIENT_READ_ONLY_MESSAGE ? "gray" : "red",
      });
    },
  });
}


