import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  // Navegar a la tienda
  irATienda(): void {
    this.router.navigate(['/productos']);
  }

  // Navegar al registro
  irARegistro(): void {
    this.router.navigate(['/auth/registro']);
  }
}