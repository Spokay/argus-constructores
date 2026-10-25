export type Category = 'RESIDENTIAL' | 'COMMERCIAL' | 'PUBLIC' | 'RENOVATION';

export const CATEGORY_LABELS: Record<Category, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  PUBLIC: 'Public',
  RENOVATION: 'Renovation',
};

/** `imageIds` is in display order; the first one is the cover. */
export interface Project {
  id: number;
  title: string;
  description: string;
  city: string | null;
  completionYear: number | null;
  category: Category;
  published: boolean;
  imageIds: number[];
}

export type ProjectRequest = Omit<Project, 'id' | 'imageIds'>;
