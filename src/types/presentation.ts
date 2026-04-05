export type SlideType =
  | "title"
  | "divider"
  | "content"
  | "split"
  | "diagram"
  | "dashboard"
  | "table"
  | "code"
  | "quote"
  | "bleed"
  | "unknown";

export interface SlideModel {
  id: string;
  index: number;
  type: SlideType;
  outerHtml: string;
  comment?: string;
}

export interface PresentationModel {
  filename: string;
  title: string;
  head: string;
  slides: SlideModel[];
  scriptBlock: string;
}

export interface PresentationFile {
  name: string;
  size: number;
  modified: string;
}
