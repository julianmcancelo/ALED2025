import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Importamos los componentes y servicios
import { AuthService } from '../auth/auth';
import { CarritoService } from '../servicios/carrito';
import { ConfiguracionService } from '../servicios/configuracion'; // Importamos el nuevo servicio
import { ProductosSupabaseService } from '../servicios/productos-supabase.service';
import { Carrito } from '../carrito/carrito';
import { Registro } from '../auth/registro/registro';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';
import { Observable, map } from 'rxjs';

/**
 * Interfaz para representar una categoría en el dropdown
 */
interface CategoriaDropdown {
  nombre: string;
  cantidad: number;
  icono: string;
}

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
  protected router = inject(Router);
  private productosService = inject(ProductosSupabaseService);
  protected carritoService = inject(CarritoService);
  protected configuracionService = inject(ConfiguracionService); // Inyectamos el servicio

  // Exponemos la señal de configuración para usarla en la plantilla.
  protected configuracion = this.configuracionService.configuracionSignal;
  currentUser = this.authService.currentUserSignal;
  isAdmin = computed(() => {
    const user = this.currentUser();
    const isAdminUser = user?.rol === 'admin';
    console.log('🔍 Header - isAdmin check:', {
      user: user ? { email: user.email, rol: user.rol } : null,
      isAdmin: isAdminUser
    });
    return isAdminUser;
  });
  
  // Estado del menú móvil
  showMobileMenu = false;

  // Estado del dropdown de categorías
  showCategoriasDropdown = false;

  // Método de debugging temporal
  debugUserStatus() {
    // Usar el método de debugging del AuthService
    this.authService.debugSession();
    
    const user = this.currentUser();
    console.log('🔍 DEBUG - Estado actual del usuario:', {
      usuario: user,
      esAdmin: this.isAdmin(),
      localStorage: localStorage.getItem('app_user_session'),
      timestamp: new Date().toISOString()
    });
    
    if (user) {
      alert(`Usuario: ${user.email}\nRol: ${user.rol}\nEs Admin: ${this.isAdmin()}\n\nRevisa la consola para más detalles.`);
    } else {
      alert('No hay usuario logueado\n\nRevisa la consola para más detalles.');
      // Intentar recargar la sesión
      this.authService.reloadSession();
    }
  }

  // Observable de categorías para el dropdown
  categorias$: Observable<CategoriaDropdown[]>;

  constructor() {
    // Inicializamos las categorías
    this.categorias$ = this.productosService.obtenerProductosActivos().pipe(
      map(productos => {
        // Agrupamos productos por categoría
        const categoriasMap = new Map<string, number>();
        
        productos.forEach((producto: any) => {
          const categoriaNombre = producto.categoria?.nombre || 'Sin categoría';
          const count = categoriasMap.get(categoriaNombre) || 0;
          categoriasMap.set(categoriaNombre, count + 1);
        });

        // Convertimos a array con iconos
        const categorias: CategoriaDropdown[] = Array.from(categoriasMap.entries()).map(([nombre, cantidad]) => ({
          nombre,
          cantidad,
          icono: this.obtenerIconoCategoria(nombre)
        }));

        // Ordenamos por cantidad (descendente)
        return categorias.sort((a, b) => b.cantidad - a.cantidad);
      })
    );
  }

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
   * Toggle del dropdown de categorías
   */
  toggleCategoriasDropdown(): void {
    this.showCategoriasDropdown = !this.showCategoriasDropdown;
  }

  /**
   * Navega a productos filtrados por categoría
   */
  navegarACategoria(categoria: string): void {
    this.router.navigate(['/productos'], { 
      queryParams: { buscar: categoria } 
    });
    this.showCategoriasDropdown = false;
    this.showMobileMenu = false;
  }

  /**
   * Obtiene el icono correspondiente a cada categoría
   */
  private obtenerIconoCategoria(categoria: string): string {
    const iconos: { [key: string]: string } = {
      'Electrónicos': 'bi-laptop',
      'Hogar': 'bi-house-fill',
      'Ropa': 'bi-bag-fill',
      'Deportes': 'bi-trophy-fill',
      'Libros': 'bi-book-fill',
      'Juguetes': 'bi-puzzle-fill'
    };
    
    return iconos[categoria] || 'bi-tag-fill';
  }

  /**
   * Cierra todos los dropdowns cuando se hace clic fuera
   */
  cerrarDropdowns(): void {
    this.showCategoriasDropdown = false;
  }
}
