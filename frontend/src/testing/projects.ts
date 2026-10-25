import { Project, ProjectRequest } from '@core/project';

export function aProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'Hospital Militar Central',
    purpose: 'Reforzamiento y modernización',
    client: 'Agencia Logística',
    areaM2: 19393,
    valueSmmlv: 34.854,
    city: 'Bogotá D.C.',
    sector: 'HOSPITAL',
    status: 'COMPLETED',
    published: true,
    imageIds: [10],
    ...overrides,
  };
}

/** The fields a create or update sends for this project. */
export function requestOf(project: Project): ProjectRequest {
  const { name, purpose, client, areaM2, valueSmmlv, city, sector, status, published } = project;
  return { name, purpose, client, areaM2, valueSmmlv, city, sector, status, published };
}
