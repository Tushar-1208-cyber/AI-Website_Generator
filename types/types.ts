export interface UserDetail {
  id?: number;
  name?: string;
  email?: string;
  credits?: number;
  plan?: string;
  [key: string]: unknown;
}

export interface ProjectDetail {
  id?: number;
  projectID?: string;
  name?: string;
  createdBy?: string;
  createdOn?: Date | string | null;
  [key: string]: unknown;
}

export interface FrameDetail {
  id?: number;
  designCode?: string;
  frameID?: string;
  projectID?: string;
  createdOn?: Date | string | null;
  [key: string]: unknown;
}

export interface ChatMessageItem {
  role?: string;
  content?: string;
  [key: string]: unknown;
}
