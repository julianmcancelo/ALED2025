import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionService } from '../services/configuracion';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  // Inyectamos el servicio para poder usarlo en la plantilla.
  protected configuracionService = inject(ConfiguracionService);
}
