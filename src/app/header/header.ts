import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios
import { AuthService } from '../auth/auth';
import { CarritoService } from '../services/carrito';
import { ConfiguracionService } from '../services/configuracion'; // Importamos el nuevo servicio
import { Carrito } from '../carrito/carrito';
import { Registro } from '../auth/registro/registro';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule, // Aún lo usamos para login/registro
    NgbDropdownModule, // Para el menú de usuario
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private offcanvasService = inject(NgbOffcanvas);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  protected carritoService = inject(CarritoService);
  protected configuracionService = inject(ConfiguracionService); // Inyectamos el servicio

  // Exponemos la señal de configuración para usarla en la plantilla.
  protected configuracion = this.configuracionService.configuracionSignal;

  currentUser = this.authService.currentUserSignal;
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');

  openRegisterDialog(): void {
    this.dialog.open(Registro, { width: '550px' });
  }

  openLoginDialog(): void {
    this.dialog.open(InicioDeSesion, { width: '450px' });
  }

  abrirDialogoCarrito(): void {
    this.offcanvasService.open(Carrito, {
      position: 'end',
      panelClass: 'carrito-offcanvas',
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
