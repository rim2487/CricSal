import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinPredictionComponent } from './win-prediction.component';

describe('WinPredictionComponent', () => {
  let component: WinPredictionComponent;
  let fixture: ComponentFixture<WinPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WinPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WinPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
