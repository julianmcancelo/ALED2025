import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth';
import { GestionProductosService } from '../../servicios/gestion-productos.service';
import { CategoriaService } from '../../servicios/categoria.service';
import { UserService } from '../../servicios/user';

/**
 * @component BienvenidaAdmin
 * Dashboard principal del panel de administración con estadísticas y accesos rápidos.
 */
@Component({
  selector: 'app-bienvenida-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class BienvenidaAdmin implements OnInit {
  // Servicios
  private authService = inject(AuthService);
  private productosService = inject(GestionProductosService);
  private categoriasService = inject(CategoriaService);
  private userService = inject(UserService);

  // Señales para datos del dashboard
  currentUser = this.authService.currentUserSignal;
  totalProductos = signal(0);
  totalCategorias = signal(0);
  totalUsuarios = signal(0);
  cargandoDatos = signal(true);

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  /**
   * Carga las estadísticas del dashboard
   */
  private cargarEstadisticas(): void {
    this.cargandoDatos.set(true);

    // Cargar productos
    this.productosService.obtenerProductos().subscribe({
      next: (productos) => {
        this.totalProductos.set(productos.length);
      },
      error: (error) => console.error('Error al cargar productos:', error)
    });

    // Cargar categorías
    this.categoriasService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.totalCategorias.set(categorias.length);
      },
      error: (error) => console.error('Error al cargar categorías:', error)
    });

    // Cargar usuarios
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.totalUsuarios.set(usuarios.length);
        this.cargandoDatos.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargandoDatos.set(false);
      }
    });
  }
}
