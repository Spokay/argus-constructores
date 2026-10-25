import { TestBed } from '@angular/core/testing';
import { AdminProjectService } from '@core/admin-project.service';
import { of } from 'rxjs';

import { aProject, requestOf } from '../../../../testing/projects';
import { provideTestingEnvironment } from '../../../../testing/test-providers';

import { ProjectList } from './project-list';

describe('ProjectList', () => {
  let service: jasmine.SpyObj<AdminProjectService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminProjectService>('AdminProjectService', [
      'list',
      'update',
      'reorder',
      'remove',
    ]);
    service.list.and.returnValue(of([aProject({ id: 1 }), aProject({ id: 2, published: false })]));
    service.update.and.returnValue(of(aProject()));
    service.reorder.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [ProjectList],
      providers: [provideTestingEnvironment(), { provide: AdminProjectService, useValue: service }],
    });
  });

  it('toggles publication with every other field unchanged', () => {
    const list = TestBed.createComponent(ProjectList).componentInstance;

    list.togglePublished(list.projects()[1]);

    expect(service.update).toHaveBeenCalledWith(2, requestOf(aProject({ id: 2, published: true })));
  });

  it('saves the whole order with the two neighbours swapped', () => {
    const list = TestBed.createComponent(ProjectList).componentInstance;

    list.move(0, 1);

    expect(service.reorder).toHaveBeenCalledWith([2, 1]);
  });
});
