import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios necesarios.
import { Register } from '../auth/register/register';
import { InicioSesion } from '../auth/inicio-sesion/inicio-sesion';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Propiedad pública para almacenar el signal del usuario actual.
  currentUser;

  // Inyectamos MatDialog para abrir modales y AuthService para la autenticación.
  constructor(
    public dialog: MatDialog,
    private authService: AuthService,
  ) {
    // Inicializamos la propiedad aquí, donde 'authService' ya está disponible.
    this.currentUser = this.authService.currentUserSignal;
  }

  /** Abre el diálogo modal de registro. */
  openRegisterDialog(): void {
    this.dialog.open(Register, { width: '450px' });
  }

  /** Abre el diálogo modal de inicio de sesión. */
  openLoginDialog(): void {
    this.dialog.open(InicioSesion, { width: '400px' });
  }

  /** Cierra la sesión del usuario. */
  logout(): void {
    this.authService.logout();
  }
}
