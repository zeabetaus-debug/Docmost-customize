export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface ChangeRequestUser {
  id?: string | null;
  name?: string | null;
}

export interface IChangeRequestComment {
  id: string;
  message: string;
  createdBy: string;
  createdAt: string;
}

export interface IChangeRequest {
  id: string;
  pageId?: string;
  status: ChangeRequestStatus;
  content: any;
  createdAt: string;
  updatedAt?: string;
  isReal?: boolean;
  isLocalOnly?: boolean;
  createdBy?: string;
  requestedBy?: ChangeRequestUser | null;
  comments?: IChangeRequestComment[];
}
