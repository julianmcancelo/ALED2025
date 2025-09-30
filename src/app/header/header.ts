import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para el @if en el template

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
    CommonModule, // Necesario para directivas como @if
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
  // Propiedad para almacenar el signal del usuario actual.
  currentUser;

  // Inyectamos los servicios necesarios en el constructor.
  constructor(
    public dialog: MatDialog,
    private authService: AuthService,
  ) {
    // Asignamos el signal del servicio a nuestra propiedad local.
    this.currentUser = this.authService.currentUserSignal;
  }

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
