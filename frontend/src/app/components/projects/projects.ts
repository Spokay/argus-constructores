import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@components/project-card/project-card';
import { SECTOR_LABELS, SECTORS, Sector } from '@core/project';
import { ProjectService } from '@core/project.service';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay, { AutoplayType } from 'embla-carousel-autoplay';
import { tap } from 'rxjs';

/**
 * Home section “Proyectos”: the published projects, in the admin's order and optionally narrowed to
 * one sector, as an Embla carousel (3 / 2 / 1 cards per view, set in CSS) that advances by itself,
 * except while hovered or focused.
 */
@Component({
  selector: 'app-projects',
  templateUrl: 'projects.html',
  styleUrl: 'projects.css',
  imports: [ProjectCard],
})
export class Projects {
  /** Emitted once the list has arrived: it changes the height of everything below it. */
  readonly loaded = output();
  readonly projects = toSignal(
    inject(ProjectService)
      .list()
      .pipe(tap(() => this.loaded.emit())),
  );

  /** `null` = every sector. */
  readonly sector = signal<Sector | null>(null);
  /** Only sectors that have a project, so no filter leads to an empty carousel. */
  readonly sectors = computed(() =>
    SECTORS.filter((sector) => this.projects()?.some((project) => project.sector === sector)),
  );
  readonly visibleProjects = computed(() => {
    const sector = this.sector();
    return sector
      ? this.projects()?.filter((project) => project.sector === sector)
      : this.projects();
  });
  readonly sectorLabels = SECTOR_LABELS;

  readonly snapCount = signal(0);
  readonly selectedSnap = signal(0);
  readonly snaps = computed(() => Array.from({ length: this.snapCount() }, (_, i) => i));
  readonly pageLabel = (page: number) => $localize`:@@projects.page:Página ${page}:page:`;

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private carousel?: EmblaCarouselType;
  private autoplay?: AutoplayType;
  private held = false;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    // Runs again when the sector filter changes the slides, so Embla re-measures them.
    afterRenderEffect(() => {
      const viewport = this.viewport()?.nativeElement;
      if (!this.visibleProjects()?.length || !viewport) return;
      if (this.carousel) {
        this.carousel.reInit();
        this.carousel.scrollTo(0, true);
        return;
      }
      // Hover and focus are handled by hold(): the plugin's own handling ignores the arrows.
      this.autoplay = Autoplay({
        delay: 5000,
        playOnInit: false,
        stopOnInteraction: false,
        stopOnFocusIn: false,
      });
      this.carousel = EmblaCarousel(
        viewport,
        { loop: true, align: 'start', slidesToScroll: 'auto' },
        [this.autoplay],
      );
      this.carousel
        .on('select', () => this.updateSnaps())
        .on('reInit', () => this.updateSnaps())
        .on('pointerUp', () => this.syncAutoplay());
      this.updateSnaps();
    });
    inject(DestroyRef).onDestroy(() => this.carousel?.destroy());
  }

  selectSector(sector: Sector | null): void {
    this.sector.set(sector);
  }

  previous(): void {
    this.carousel?.scrollPrev();
  }

  next(): void {
    this.carousel?.scrollNext();
  }

  goTo(snap: number): void {
    this.carousel?.scrollTo(snap);
  }

  /** Mouse over or keyboard focus inside: hold the autoplay so the visitor can read. */
  hold(held: boolean): void {
    this.held = held;
    this.syncAutoplay();
  }

  private updateSnaps(): void {
    this.snapCount.set(this.carousel!.scrollSnapList().length);
    this.selectedSnap.set(this.carousel!.selectedScrollSnap());
    this.syncAutoplay();
  }

  private syncAutoplay(): void {
    if (!this.autoplay) return;
    if (this.reducedMotion || this.held || this.snapCount() <= 1) this.autoplay.stop();
    else if (!this.autoplay.isPlaying()) this.autoplay.play();
  }
}
