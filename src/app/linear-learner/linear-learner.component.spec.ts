import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinearLearnerComponent } from './linear-learner.component';

describe('LinearLearnerComponent', () => {
  let component: LinearLearnerComponent;
  let fixture: ComponentFixture<LinearLearnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinearLearnerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinearLearnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
