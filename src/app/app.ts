import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importamos CommonModule
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Importamos MatDialog

// Importamos los componentes que vamos a usar
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { Registro } from './auth/registro/registro';

/**
 * Este es el componente raíz (principal) de la aplicación.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, MatDialogModule], // Añadimos los módulos necesarios
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Final');

  constructor(public dialog: MatDialog) {}

  /**
   * Abre el diálogo modal de registro.
   * Replicamos esta función aquí para que el botón del "Hero" funcione.
   */
  openRegisterDialog(): void {
    this.dialog.open(Registro, {
      width: '550px',
    });
  }
}
