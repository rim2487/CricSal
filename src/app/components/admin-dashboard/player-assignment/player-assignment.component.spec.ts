import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerAssignmentComponent } from './player-assignment.component';

describe('PlayerAssignmentComponent', () => {
  let component: PlayerAssignmentComponent;
  let fixture: ComponentFixture<PlayerAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
