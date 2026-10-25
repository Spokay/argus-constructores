import { formatNumber } from '@angular/common';

import { Project, SECTOR_LABELS } from './project';

/** “19.393 m²” in es-CO, “19,393 m²” in English. */
export function formatArea(value: number, locale: string): string {
  return `${formatNumber(value, locale, '1.0-2')} m²`;
}

/** “34,854 SMMLV” in es-CO (decimal comma), as the brochure prints it. */
export function formatValue(value: number, locale: string): string {
  return `${formatNumber(value, locale, '1.0-3')} SMMLV`;
}

/** The card's top line: the sector, or “En ejecución” while the project is being built. */
export function sectorLine(project: Project): string {
  return project.status === 'IN_PROGRESS'
    ? $localize`:@@status.inProgress:En ejecución`
    : SECTOR_LABELS[project.sector];
}
