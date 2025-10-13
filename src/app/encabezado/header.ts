import { Component, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios
import { AuthService } from '../auth/auth';
import { CarritoService } from '../servicios/carrito';
import { ConfiguracionService } from '../servicios/configuracion'; // Importamos el nuevo servicio
import { CategoriaService, Categoria } from '../servicios/categoria.service';
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
  private router = inject(Router);
  protected carritoService = inject(CarritoService);
  protected configuracionService = inject(ConfiguracionService); // Inyectamos el servicio
  private categoriaService = inject(CategoriaService);

  // Exponemos la señal de configuración para usarla en la plantilla.
  protected configuracion = this.configuracionService.configuracionSignal;

  currentUser = this.authService.currentUserSignal;
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');
  
  // Estado del menú móvil
  showMobileMenu = false;

  // Estado del modal de categorías
  showCategoriasModal = false;
  categorias: Categoria[] = [];
  cargandoCategorias = false;

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

  /**
   * Método para buscar productos
   */
  buscarProductos(termino: string): void {
    if (termino.trim()) {
      // Navegar a la página de productos con el término de búsqueda
      this.router.navigate(['/productos'], { 
        queryParams: { buscar: termino.trim() } 
      });
      // Cerrar menú móvil si está abierto
      this.showMobileMenu = false;
    }
  }

  /**
   * Toggle del menú móvil
   */
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  /**
   * Abre el modal de categorías
   */
  abrirModalCategorias(): void {
    this.showCategoriasModal = true;
    this.cargarCategorias();
    // Cerrar menú móvil si está abierto
    this.showMobileMenu = false;
  }

  /**
   * Cierra el modal de categorías
   */
  cerrarModalCategorias(): void {
    this.showCategoriasModal = false;
  }

  /**
   * Carga las categorías disponibles
   */
  cargarCategorias(): void {
    if (this.categorias.length > 0) return; // Ya están cargadas
    
    this.cargandoCategorias = true;
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargandoCategorias = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.cargandoCategorias = false;
      }
    });
  }

  /**
   * Navega a una categoría específica
   */
  navegarACategoria(categoria: Categoria): void {
    this.router.navigate(['/productos'], { 
      queryParams: { categoria: categoria.nombre } 
    });
    this.cerrarModalCategorias();
  }

  /**
   * Navega a todas las categorías
   */
  verTodasLasCategorias(): void {
    this.router.navigate(['/categorias']);
    this.cerrarModalCategorias();
  }

  /**
   * Maneja eventos de teclado para cerrar el modal con Escape
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showCategoriasModal) {
      this.cerrarModalCategorias();
    }
  }
}
