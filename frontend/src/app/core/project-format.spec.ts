import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { aProject } from '../../testing/projects';

import { formatArea, formatValue, sectorLine } from './project-format';

describe('project formats', () => {
  beforeAll(() => registerLocaleData(localeEsCo));

  it('prints figures as the brochure does in es-CO', () => {
    expect(formatArea(19393, 'es-CO')).toBe('19.393 m²');
    expect(formatValue(34.854, 'es-CO')).toBe('34,854 SMMLV');
  });

  it('uses English separators in English', () => {
    expect(formatArea(19393, 'en-US')).toBe('19,393 m²');
    expect(formatValue(34.854, 'en-US')).toBe('34.854 SMMLV');
  });

  it('announces a project in execution instead of its sector', () => {
    expect(sectorLine(aProject())).toBe('Sector hospitalario');
    expect(sectorLine(aProject({ status: 'IN_PROGRESS' }))).toBe('En ejecución');
  });
});
