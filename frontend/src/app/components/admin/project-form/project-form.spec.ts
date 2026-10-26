import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminProjectService } from '@core/admin-project.service';
import { of, throwError } from 'rxjs';

import { aProject, requestOf } from '../../../../testing/projects';
import { provideTestingEnvironment } from '../../../../testing/test-providers';

import { ProjectForm } from './project-form';

describe('ProjectForm', () => {
  let service: jasmine.SpyObj<AdminProjectService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminProjectService>('AdminProjectService', [
      'find',
      'create',
      'update',
      'uploadImage',
      'removeImage',
      'imageBlob',
    ]);
    service.imageBlob.and.returnValue(of(new Blob()));
    TestBed.configureTestingModule({
      imports: [ProjectForm],
      providers: [provideTestingEnvironment(), { provide: AdminProjectService, useValue: service }],
    });
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function editing(id: number) {
    const fixture = TestBed.createComponent(ProjectForm);
    fixture.componentRef.setInput('id', String(id));
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function choose(form: ProjectForm, file: File): void {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    form.replacePhoto({ target: input } as unknown as Event);
  }

  it('creates the project then continues on its edit page for the photo', () => {
    service.create.and.returnValue(of(aProject({ id: 7 })));
    const fixture = TestBed.createComponent(ProjectForm);
    fixture.detectChanges();
    const fields = requestOf(aProject());
    fixture.componentInstance.form.setValue(fields);

    fixture.componentInstance.save();

    expect(service.create).toHaveBeenCalledWith(fields);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/admin/projects', 7]);
  });

  it('does not save an incomplete project', () => {
    const fixture = TestBed.createComponent(ProjectForm);
    fixture.detectChanges();

    fixture.componentInstance.save();

    expect(service.create).not.toHaveBeenCalled();
  });

  it('refuses an area written with a thousands dot instead of sending it', () => {
    const fixture = TestBed.createComponent(ProjectForm);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ ...requestOf(aProject()), areaM2: 19.393 });

    fixture.componentInstance.save();

    expect(service.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.areaM2.hasError('maxDecimals')).toBeTrue();
  });

  it('uploads the new photo before removing the previous one', () => {
    service.find.and.returnValue(of(aProject({ id: 1, imageIds: [10] })));
    service.uploadImage.and.returnValue(of({ id: 11 }));
    service.removeImage.and.returnValue(of(undefined));
    const form = editing(1);

    choose(form, new File(['x'], 'photo.png'));

    expect(service.uploadImage).toHaveBeenCalledBefore(service.removeImage);
    expect(service.removeImage).toHaveBeenCalledOnceWith(1, 10);
  });

  it('keeps the previous photo and explains a rejected file', () => {
    service.find.and.returnValue(of(aProject({ id: 1, imageIds: [10] })));
    service.uploadImage.and.returnValue(throwError(() => new HttpErrorResponse({ status: 415 })));
    const form = editing(1);

    choose(form, new File(['x'], 'photo.svg'));

    expect(service.removeImage).not.toHaveBeenCalled();
    expect(form.error()).toContain('JPEG, PNG o WebP');
  });
});
