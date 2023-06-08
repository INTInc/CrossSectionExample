import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CrosssectionComponent } from './crosssection.component';

describe('CrosssectionComponent', () => {
  let component: CrosssectionComponent;
  let fixture: ComponentFixture<CrosssectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CrosssectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrosssectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
