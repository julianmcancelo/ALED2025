import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfiguracionService } from '../servicios/configuracion';
import { NovedadesService, Novedad } from '../servicios/novedades.service'; // Importar NovedadesService
import { Registro } from '../auth/registro/registro';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected configuracionService = inject(ConfiguracionService);
  private novedadesService = inject(NovedadesService); // Usar NovedadesService
  protected authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // --- PROPIEDADES ---
  novedades$!: Observable<Novedad[]>; // Cambiar a novedades

  ngOnInit(): void {
    // Obtener las novedades y tomar las primeras 5
    this.novedades$ = this.novedadesService
      .getNovedades()
      .pipe(map((novedades) => novedades.slice(0, 5)));
  }

  /**
   * Navega a la página de la tienda.
   */
  irATienda(): void {
    this.router.navigate(['/productos']);
  }

  /**
   * Abre el diálogo modal para el registro de un nuevo usuario.
   */
  irARegistro(): void {
    this.dialog.open(Registro);
  }
}
