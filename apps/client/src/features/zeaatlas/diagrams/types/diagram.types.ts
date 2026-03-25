export interface DiagramVersion {
  id: string;
  code: string;
  createdAt: string;
}

export interface Diagram {
  id: string;
  title: string;
  versions: DiagramVersion[];
}
