import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatsmanSelectDialogComponent } from './batsman-select-dialog.component';

describe('BatsmanSelectDialogComponent', () => {
  let component: BatsmanSelectDialogComponent;
  let fixture: ComponentFixture<BatsmanSelectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatsmanSelectDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatsmanSelectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
