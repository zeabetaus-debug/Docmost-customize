export type TaxonomyType =
  | "owner"
  | "system"
  | "workflow"
  | "environment"
  | "severity";

export interface TaxonomyItem {
  id: string;
  name: string;
  type: TaxonomyType;
  color?: string;
  createdAt: string;
}
