import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';

interface ServiceGroup {
  /** Absent when the service is a single list. */
  title?: string;
  items: string[];
}

const SERVICES: { title: string; groups: ServiceGroup[] }[] = [
  {
    title: $localize`:@@footer.consulting:Consultoría`,
    groups: [
      {
        items: [
          $localize`:@@services.designs:Diseños y estudios técnicos`,
          $localize`:@@services.supervision:Interventoría`,
          $localize`:@@services.projectManagement:Gerencia de proyectos`,
          $localize`:@@services.delegatedAdministration:Administración delegada`,
          $localize`:@@services.feasibility:Estudio de factibilidad`,
        ],
      },
    ],
  },
  {
    title: $localize`:@@footer.construction:Construcción`,
    groups: [
      {
        title: $localize`:@@services.buildings:Edificaciones`,
        items: [
          $localize`:@@services.health:Hospitalaria`,
          $localize`:@@services.education:Educativa`,
          $localize`:@@services.commercial:Comercial`,
          $localize`:@@services.institutional:Institucional`,
          $localize`:@@services.housing:Vivienda`,
          $localize`:@@services.integrated:Servicios integrados`,
        ],
      },
      {
        title: $localize`:@@services.infrastructure:Obras de infraestructura`,
        items: [
          $localize`:@@services.roads:Vías`,
          $localize`:@@services.aqueducts:Acueductos`,
          $localize`:@@services.sewerage:Alcantarillado`,
          $localize`:@@services.canals:Canales`,
          $localize`:@@services.parks:Parques`,
          $localize`:@@services.bridges:Puentes vehiculares y peatonales`,
        ],
      },
    ],
  },
  {
    title: $localize`:@@footer.commercialization:Comercialización`,
    groups: [
      {
        title: $localize`:@@services.realEstate:Proyectos inmobiliarios`,
        items: [
          $localize`:@@services.housing:Vivienda`,
          $localize`:@@services.shoppingCentres:Centros comerciales`,
          $localize`:@@services.lots:Loteos`,
          $localize`:@@services.parcelling:Parcelaciones`,
          $localize`:@@services.hospitality:Hotelería`,
          $localize`:@@services.recreation:Centros de recreación`,
        ],
      },
      {
        title: $localize`:@@services.integrated:Servicios integrados`,
        items: [
          $localize`:@@services.offices:Oficinas`,
          $localize`:@@services.parking:Parqueaderos`,
          $localize`:@@services.medicalOffices:Consultorios`,
        ],
      },
    ],
  },
];

/**
 * Home section “Servicios”: the brochure's three services and what each covers. Each column is
 * revealed, item by item, the first time it scrolls into view (animation in the CSS).
 */
@Component({
  selector: 'app-services',
  templateUrl: 'services.html',
  styleUrl: 'services.css',
  host: { id: 'services' },
})
export class Services {
  /** Each item carries its rank within its column, which staggers its appearance. */
  readonly services = SERVICES.map((service) => {
    let rank = 0;
    return {
      ...service,
      groups: service.groups.map((group) => ({
        ...group,
        items: group.items.map((text) => ({ text, rank: rank++ })),
      })),
    };
  });
  /** Indexes of the columns already revealed. */
  readonly revealed = signal(new Set<number>());

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // Per column, once its top passes the lowest fifth of the screen: watching the whole section
    // fired on its heading alone, and the lists had finished animating before being seen.
    const observer = new IntersectionObserver(
      (entries) => {
        const columns = Array.from(host.querySelectorAll('.service'));
        for (const entry of entries.filter((e) => e.isIntersecting)) {
          this.revealed.update((revealed) => new Set(revealed).add(columns.indexOf(entry.target)));
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -20% 0px' },
    );
    afterNextRender(() =>
      host.querySelectorAll('.service').forEach((column) => observer.observe(column)),
    );
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
