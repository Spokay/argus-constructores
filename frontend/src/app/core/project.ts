export type Sector = 'HOSPITAL' | 'EDUCATION' | 'INSTITUTIONAL' | 'INFRASTRUCTURE' | 'HOUSING';
export type ProjectStatus = 'COMPLETED' | 'IN_PROGRESS';

/** Field names are the code's; the brochure's labels are Objeto (purpose), Contratante (client), Valor (valueSmmlv). */
export interface Project {
  id: number;
  name: string;
  purpose: string;
  client: string;
  areaM2: number | null;
  valueSmmlv: number | null;
  /** “City - Department”, e.g. “Medellín - Antioquia”. */
  city: string;
  sector: Sector;
  status: ProjectStatus;
  published: boolean;
  /** Display order; the first one is the cover. */
  imageIds: number[];
}

export type ProjectRequest = Omit<Project, 'id' | 'imageIds'>;

export const SECTORS: Sector[] = [
  'HOSPITAL',
  'EDUCATION',
  'INSTITUTIONAL',
  'INFRASTRUCTURE',
  'HOUSING',
];

export const SECTOR_LABELS: Record<Sector, string> = {
  HOSPITAL: $localize`:@@sector.hospital:Sector hospitalario`,
  EDUCATION: $localize`:@@sector.education:Sector educativo`,
  INSTITUTIONAL: $localize`:@@sector.institutional:Sector institucional`,
  INFRASTRUCTURE: $localize`:@@sector.infrastructure:Sector infraestructura`,
  HOUSING: $localize`:@@sector.housing:Sector vivienda`,
};
