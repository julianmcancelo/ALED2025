import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * @component AuthRequeridoComponent
 * Modal que informa al usuario que necesita iniciar sesión o registrarse para continuar.
 * Devuelve una cadena ('login' o 'register') según la acción del usuario.
 */
@Component({
  selector: 'app-auth-requerido',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './auth-requerido.html',
  styleUrls: ['./auth-requerido.css'],
})
export class AuthRequeridoComponent {
  constructor(public dialogRef: MatDialogRef<AuthRequeridoComponent>) {}

  /**
   * Cierra el diálogo y devuelve la acción seleccionada por el usuario.
   * @param action - La acción que el usuario eligió ('login' o 'register').
   */
  closeDialog(action: 'login' | 'register'): void {
    this.dialogRef.close(action);
  }
}
