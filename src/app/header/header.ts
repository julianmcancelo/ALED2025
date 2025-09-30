import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Importaciones de Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios de autenticación
import { Registro } from '../auth/registro/registro';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, // Importamos RouterLink para los botones de navegación
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Inyectamos los servicios necesarios.
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  // Exponemos el signal del usuario directamente a la plantilla.
  currentUser = this.authService.currentUserSignal;

  // Creamos un 'computed signal' que deriva del currentUser.
  // Se actualizará automáticamente si 'currentUser' cambia.
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');

  /** Abre el diálogo modal de registro. */
  openRegisterDialog(): void {
    this.dialog.open(Registro, { width: '550px' });
  }

  /** Abre el diálogo modal de inicio de sesión. */
  openLoginDialog(): void {
    this.dialog.open(InicioDeSesion, { width: '450px' });
  }

  /** Cierra la sesión del usuario. */
  logout(): void {
    this.authService.logout();
  }
}
