import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminProjectService } from '@core/admin-project.service';
import {
  Project,
  ProjectRequest,
  ProjectStatus,
  SECTOR_LABELS,
  SECTORS,
  Sector,
} from '@core/project';
import { concatMap, forkJoin, map, of } from 'rxjs';

/** Create a project, then (once it has an id) set its photo. One photo per project is shown. */
@Component({
  selector: 'app-project-form',
  templateUrl: 'project-form.html',
  styleUrl: 'project-form.css',
  imports: [ReactiveFormsModule, RouterLink],
})
export class ProjectForm implements OnInit {
  private readonly adminProjectService = inject(AdminProjectService);
  private readonly router = inject(Router);

  /** Route parameter: absent on `/admin/projects/new`. */
  readonly id = input<string>();

  readonly sectors = SECTORS;
  readonly sectorLabels = SECTOR_LABELS;
  readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    purpose: ['', Validators.required],
    client: ['', [Validators.required, Validators.maxLength(200)]],
    // Same scale as the API's @Digits: a Colombian thousands dot (19.393) is caught here, not as a 400.
    areaM2: [null as number | null, [Validators.min(0), maxDecimals(2)]],
    valueSmmlv: [null as number | null, [Validators.min(0), maxDecimals(3)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    sector: ['HOSPITAL' as Sector, Validators.required],
    status: ['COMPLETED' as ProjectStatus, Validators.required],
    published: [false],
  });

  readonly project = signal<Project | null>(null);
  readonly photoUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePhoto());
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.load(Number(id));
    }
  }

  invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request: ProjectRequest = this.form.getRawValue();
    const existing = this.project();
    this.busy.set(true);
    this.error.set(null);
    (existing
      ? this.adminProjectService.update(existing.id, request)
      : this.adminProjectService.create(request)
    ).subscribe({
      next: (saved) => {
        this.busy.set(false);
        if (existing) {
          this.project.set(saved);
        } else {
          // The photo needs an id to attach to: continue on the edit page.
          void this.router.navigate(['/admin/projects', saved.id]);
        }
      },
      error: () => {
        this.busy.set(false);
        this.error.set($localize`:@@admin.saveError:Error: no se pudo guardar el cambio.`);
      },
    });
  }

  /** Uploads the new photo first, then removes the previous ones: a failed upload keeps the old photo. */
  replacePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const project = this.project();
    const file = input.files?.[0];
    input.value = '';
    if (!project || !file) return;
    this.busy.set(true);
    this.error.set(null);
    this.adminProjectService
      .uploadImage(project.id, file)
      .pipe(
        concatMap(() =>
          project.imageIds.length
            ? forkJoin(
                project.imageIds.map((id) => this.adminProjectService.removeImage(project.id, id)),
              )
            : of(null),
        ),
        map(() => undefined),
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.load(project.id);
        },
        error: (error: HttpErrorResponse) => {
          this.busy.set(false);
          this.error.set(photoError(error));
          this.load(project.id);
        },
      });
  }

  private load(id: number): void {
    this.adminProjectService.find(id).subscribe({
      next: (project) => {
        this.project.set(project);
        const { name, purpose, client, areaM2, valueSmmlv, city, sector, status, published } =
          project;
        this.form.setValue({
          name,
          purpose,
          client,
          areaM2,
          valueSmmlv,
          city,
          sector,
          status,
          published,
        });
        this.loadPhoto(project);
      },
      error: () =>
        this.error.set($localize`:@@admin.projectLoadError:Error: no se pudo cargar el proyecto.`),
    });
  }

  /** Through HttpClient: a hidden project's photo needs the token an `<img src>` would not send. */
  private loadPhoto(project: Project): void {
    this.revokePhoto();
    if (!project.imageIds.length) return;
    this.adminProjectService
      .imageBlob(project.id, project.imageIds[0])
      .subscribe((blob) => this.photoUrl.set(URL.createObjectURL(blob)));
  }

  private revokePhoto(): void {
    const url = this.photoUrl();
    if (url) URL.revokeObjectURL(url);
    this.photoUrl.set(null);
  }
}

export function maxDecimals(digits: number): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const decimals = String(control.value ?? '').split('.')[1]?.length ?? 0;
    return decimals > digits ? { maxDecimals: digits } : null;
  };
}

function photoError(error: HttpErrorResponse): string {
  if (error.status === 413) return $localize`:@@admin.photoTooLarge:Error: la foto supera 10 MB.`;
  if (error.status === 415)
    return $localize`:@@admin.photoType:Error: solo se aceptan fotos JPEG, PNG o WebP.`;
  return $localize`:@@admin.saveError:Error: no se pudo guardar el cambio.`;
}
