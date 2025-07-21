import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSuggestorComponent } from './player-suggestor.component';

describe('PlayerSuggestorComponent', () => {
  let component: PlayerSuggestorComponent;
  let fixture: ComponentFixture<PlayerSuggestorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerSuggestorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerSuggestorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
