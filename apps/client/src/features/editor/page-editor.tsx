import "@/features/editor/styles/index.css";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import {
  Editor,
  EditorContent,
  EditorProvider,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import {
  collabExtensions,
  mainExtensions,
} from "@/features/editor/extensions/extensions";
import { useAtom, useAtomValue } from "jotai";
import useCollaborationUrl from "@/features/editor/hooks/use-collaboration-url";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import {
  pageEditorAtom,
  yjsConnectionStatusAtom,
} from "@/features/editor/atoms/editor-atoms";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import {
  activeCommentIdAtom,
  showCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import CommentDialog from "@/features/comment/components/comment-dialog";
import { EditorBubbleMenu } from "@/features/editor/components/bubble-menu/bubble-menu";
import TableCellMenu from "@/features/editor/components/table/table-cell-menu";
import TableMenu from "@/features/editor/components/table/table-menu";
import ImageMenu from "@/features/editor/components/image/image-menu";
import CalloutMenu from "@/features/editor/components/callout/callout-menu";
import VideoMenu from "@/features/editor/components/video/video-menu";
import SubpagesMenu from "@/features/editor/components/subpages/subpages-menu";
import { useParams } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { PageEditMode } from "@/features/user/types/user.types";
import { queryClient } from "@/main";
import { IPage } from "@/features/page/types/page.types";

// ✅ IMPORT GLOBAL CLIENT MODE
import { clientModeAtom } from "@/store/client-store";

interface PageEditorProps {
  pageId: string;
  editable: boolean;
  content: any;
}

export default function PageEditor({
  pageId,
  editable,
  content,
}: PageEditorProps) {
  const collaborationURL = useCollaborationUrl();
  const editorRef = useRef<Editor | null>(null);

  const [currentUser] = useAtom(currentUserAtom);

  // ✅ CORRECT CLIENT MODE SOURCE (PERSISTENT)
  const isClientMode = useAtomValue(clientModeAtom);

  const [, setEditor] = useAtom(pageEditorAtom) as [any, (editor: Editor) => void];
  const [, setAsideState] = useAtom(asideStateAtom);
  const [, setActiveCommentId] = useAtom(activeCommentIdAtom);
  const [showCommentPopup] = useAtom(showCommentPopupAtom);

  const [isLocalSynced, setIsLocalSynced] = useState(false);
  const [isRemoteSynced, setIsRemoteSynced] = useState(false);
  const [, setYjsConnectionStatus] = useAtom(yjsConnectionStatusAtom);

  const { pageSlug } = useParams();
  const slugId = extractPageSlugId(pageSlug);

  const userPageEditMode =
    currentUser?.user?.settings?.preferences?.pageEditMode ?? PageEditMode.Edit;

  const providersRef = useRef<any>(null);
  const [providersReady, setProvidersReady] = useState(false);

  // 🔥 YJS SETUP
  useEffect(() => {
    const ydoc = new Y.Doc();
    const local = new IndexeddbPersistence(`page.${pageId}`, ydoc);
    const socket = new HocuspocusProviderWebsocket({ url: collaborationURL });

    const remote = new HocuspocusProvider({
      websocketProvider: socket,
      name: `page.${pageId}`,
      document: ydoc,
    });

    local.on("synced", () => setIsLocalSynced(true));
    remote.on("synced", () => setIsRemoteSynced(true));
    remote.on("status", (e) => setYjsConnectionStatus(e.status));

    providersRef.current = { local, remote, socket };
    setProvidersReady(true);

    return () => {
      socket.destroy();
      remote.destroy();
      local.destroy();
    };
  }, [pageId]);

  // 🔥 EXTENSIONS
  const extensions = useMemo(() => {
    if (!providersReady || !currentUser?.user) return mainExtensions;

    return [
      ...mainExtensions,
      ...collabExtensions(providersRef.current.remote, currentUser.user),
    ];
  }, [providersReady, currentUser?.user]);

  // 🔥 EDITOR INIT
  const editor = useEditor(
    {
      extensions,

      // ✅ HARD LOCK
      editable: !isClientMode && editable,

      editorProps: {
        handleDOMEvents: {
          keydown: (_view, event) => {
            if (isClientMode) {
              event.preventDefault();
              return true;
            }
          },
        },

        handlePaste: () => isClientMode,
        handleDrop: () => isClientMode,
      },

      onCreate: ({ editor }) => {
        setEditor(editor);
        editorRef.current = editor;
      },

      onUpdate: ({ editor }) => {
        if (editor.isEmpty) return;

        const pageData = queryClient.getQueryData<IPage>(["pages", slugId]);

        if (pageData) {
          queryClient.setQueryData(["pages", slugId], {
            ...pageData,
            content: editor.getJSON(),
          });
        }
      },
    },
    [pageId, extensions, isClientMode],
  );

  const editorIsEditable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isEditable ?? false,
  });

  // 🔥 FORCE LOCK (IMPORTANT)
  useEffect(() => {
    if (!editor) return;

    if (isClientMode) {
      editor.setEditable(false);
    } else if (userPageEditMode === PageEditMode.Read) {
      editor.setEditable(false);
    } else {
      editor.setEditable(true);
    }
  }, [editor, isClientMode, userPageEditMode]);

  // ⏳ LOADING STATE
  if (!providersReady) {
    return (
      <EditorProvider
        editable={false}
        extensions={mainExtensions}
        content={content}
      />
    );
  }

  return (
    <div className={isClientMode ? "client-mode" : ""}>
      <EditorContent editor={editor} />

      {/* ✅ HIDE ALL MENUS IN CLIENT MODE */}
      {!isClientMode && editor && editorIsEditable && (
        <>
          <EditorBubbleMenu editor={editor} />
          <TableMenu editor={editor} />
          <TableCellMenu editor={editor} />
          <ImageMenu editor={editor} />
          <VideoMenu editor={editor} />
          <CalloutMenu editor={editor} />
          <SubpagesMenu editor={editor} />
        </>
      )}

      {showCommentPopup && <CommentDialog editor={editor} pageId={pageId} />}
    </div>
  );
}