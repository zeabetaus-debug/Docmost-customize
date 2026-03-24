import api from "@/lib/api-client";
import {
  IAddSpaceMember,
  IChangeSpaceMemberRole,
  IExportSpaceParams,
  IRemoveSpaceMember,
  ISpace,
  ISpaceMember,
} from "@/features/space/types/space.types";
import { IPagination, QueryParams } from "@/lib/types.ts";
import { saveAs } from "file-saver";

import { getDefaultStore } from "jotai";
import { clientAtom } from "@/store/client-store";

/**
 * ✅ Get current clientId safely
 */
function getClientId() {
  const store = getDefaultStore();
  return store.get(clientAtom);
}

/**
 * ✅ Attach clientId automatically
 */
function withClient<T extends object>(data?: T): T & { clientId: string | null } {
  return {
    ...(data || ({} as T)),
    clientId: getClientId(),
  };
}

/**
 * =========================
 * SPACES
 * =========================
 */

export async function getSpaces(
  params?: QueryParams,
): Promise<IPagination<ISpace>> {
  const req = await api.post("/spaces", withClient(params));
  return req.data;
}

export async function getSpaceById(spaceId: string): Promise<ISpace> {
  const req = await api.post<ISpace>(
    "/spaces/info",
    withClient({ spaceId }),
  );
  return req.data;
}

export async function createSpace(data: Partial<ISpace>): Promise<ISpace> {
  const req = await api.post<ISpace>(
    "/spaces/create",
    withClient(data),
  );
  return req.data;
}

export async function updateSpace(data: Partial<ISpace>): Promise<ISpace> {
  const req = await api.post<ISpace>(
    "/spaces/update",
    withClient(data),
  );
  return req.data;
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await api.post("/spaces/delete", withClient({ spaceId }));
}

/**
 * =========================
 * MEMBERS (NO CLIENT NEEDED)
 * =========================
 */

export async function getSpaceMembers(
  spaceId: string,
  params?: QueryParams,
): Promise<IPagination<ISpaceMember>> {
  const req = await api.post("/spaces/members", { spaceId, ...params });
  return req.data;
}

export async function addSpaceMember(data: IAddSpaceMember): Promise<void> {
  await api.post("/spaces/members/add", data);
}

export async function removeSpaceMember(
  data: IRemoveSpaceMember,
): Promise<void> {
  await api.post("/spaces/members/remove", data);
}

export async function changeMemberRole(
  data: IChangeSpaceMemberRole,
): Promise<void> {
  await api.post("/spaces/members/change-role", data);
}

/**
 * =========================
 * EXPORT
 * =========================
 */

export async function exportSpace(data: IExportSpaceParams): Promise<void> {
  const req = await api.post(
    "/spaces/export",
    withClient(data),
    { responseType: "blob" },
  );

  const fileName =
    req?.headers["content-disposition"]
      ?.split("filename=")[1]
      ?.replace(/"/g, "") || "export.zip";

  let decodedFileName = fileName;
  try {
    decodedFileName = decodeURIComponent(fileName);
  } catch {
    // Ignore decoding errors and use the original fileName
  }

  saveAs(req.data, decodedFileName);
}