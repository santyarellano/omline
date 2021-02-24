import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreprocessorComponent } from './preprocessor.component';

describe('PreprocessorComponent', () => {
  let component: PreprocessorComponent;
  let fixture: ComponentFixture<PreprocessorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreprocessorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreprocessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
