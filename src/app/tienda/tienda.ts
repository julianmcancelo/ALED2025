import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';
import { CarritoService } from '../servicios/carrito';
import Swal from 'sweetalert2';

/**
 * @component TiendaComponent
{{ ... }}
 */
@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tienda.html',
  styleUrls: ['./tienda.css'],
})
export class TiendaComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- PROPIEDADES ---
  /**
   * Observable que contiene la lista de productos activos o filtrados por búsqueda.
   * La plantilla se suscribirá a este observable usando el pipe 'async'.
   */
  productos$!: Observable<Producto[]>;

  /**
   * Término de búsqueda actual (para mostrar en la interfaz)
   */
  terminoBusqueda: string = '';

  /**
   * Número total de productos encontrados (para estadísticas)
   */
  totalProductos: number = 0;

  ngOnInit(): void {
    console.log('🏪 Inicializando componente Tienda...');
    
    // Escuchamos los cambios en los query parameters para detectar búsquedas
    this.productos$ = this.route.queryParams.pipe(
      switchMap(params => {
        const buscar = params['buscar'] || '';
        this.terminoBusqueda = buscar;
        
        console.log(`🔍 Parámetros de búsqueda detectados: "${buscar}"`);
        
        if (buscar) {
          console.log(`📋 Realizando búsqueda de productos con término: "${buscar}"`);
          return this.productosService.buscarProductos(buscar);
        } else {
          console.log('📦 Mostrando todos los productos activos');
          return this.productosService.obtenerProductosActivos();
        }
      }),
      map(productos => {
        this.totalProductos = productos.length;
        console.log(`✅ Productos cargados: ${productos.length}`);
        
        // Mostramos información de los productos para debugging
        if (this.terminoBusqueda) {
          console.log(`🎯 Resultados de búsqueda para "${this.terminoBusqueda}": ${productos.length} productos`);
        }
        
        return productos;
      })
    );
  }

  /**
   * Añade un producto al carrito de compras.
   * @param producto - El producto que se va a añadir.
   */
  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto(producto);
    // Mostramos una notificación amigable al usuario.
    Swal.fire({
      title: '¡Añadido!',
      text: `"${producto.nombre}" se ha añadido a tu carrito.`,
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }

  /**
   * Navega a la página de detalles del producto.
   * @param producto - El producto del cual se quieren ver los detalles.
   */
  verDetalles(producto: Producto): void {
    this.router.navigate(['/producto', producto.id]);
  }

  /**
   * Maneja el error cuando una imagen no se puede cargar.
   * Reemplaza la imagen rota con un placeholder.
   * @param event - El evento de error de la imagen.
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // La imagen se ocultará y se mostrará el placeholder del @else
  }
}
