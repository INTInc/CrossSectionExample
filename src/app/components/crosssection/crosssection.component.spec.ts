import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrosssectionComponent } from './crosssection.component';

describe('CrosssectionComponent', () => {
  let component: CrosssectionComponent;
  let fixture: ComponentFixture<CrosssectionComponent>;

  beforeEach(async(() => {
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
