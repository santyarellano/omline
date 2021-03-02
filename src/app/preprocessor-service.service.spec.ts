import { TestBed } from '@angular/core/testing';

import { PreprocessorServiceService } from './preprocessor-service.service';

describe('PreprocessorServiceService', () => {
  let service: PreprocessorServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreprocessorServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
