import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Importaciones de Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios
import { AuthService } from '../auth/auth';
import { CarritoService } from '../services/carrito';
import { Carrito } from '../carrito/carrito';
import { Registro } from '../auth/registro/registro';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private modalService = inject(NgbModal);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog); // Volvemos a inyectar MatDialog
  protected carritoService = inject(CarritoService);

  currentUser = this.authService.currentUserSignal;
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');

  /**
   * Abre el diálogo de registro usando MatDialog.
   */
  openRegisterDialog(): void {
    this.dialog.open(Registro, { width: '550px' });
  }

  /**
   * Abre el diálogo de inicio de sesión usando MatDialog.
   */
  openLoginDialog(): void {
    this.dialog.open(InicioDeSesion, { width: '450px' });
  }

  /**
   * Abre el diálogo modal del carrito de compras usando ng-bootstrap.
   */
  abrirDialogoCarrito(): void {
    this.modalService.open(Carrito, {
      size: 'lg', // Un tamaño grande para el modal
      centered: true, // Centra el modal verticalmente
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
