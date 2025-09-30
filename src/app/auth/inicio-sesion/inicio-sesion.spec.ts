import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioDeSesion } from './inicio-sesion';

describe('InicioDeSesion', () => {
  let component: InicioDeSesion;
  let fixture: ComponentFixture<InicioDeSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioDeSesion],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioDeSesion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
