import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineupPredictionComponent } from './lineup-prediction.component';

describe('LineupPredictionComponent', () => {
  let component: LineupPredictionComponent;
  let fixture: ComponentFixture<LineupPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineupPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineupPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
