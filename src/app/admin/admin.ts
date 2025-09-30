import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // --- EFECTO DE SEGURIDAD EN TIEMPO REAL ---
    // Este 'effect' se ejecutará cada vez que la señal del usuario cambie.
    effect(() => {
      const user = this.authService.currentUserSignal();
      // Si el usuario ya no es 'admin' (o es nulo), lo expulsamos.
      if (user?.rol !== 'admin') {
        console.log('Privilegios de administrador revocados. Redirigiendo a inicio...');
        this.router.navigate(['/']);
      }
    });
  }
}
