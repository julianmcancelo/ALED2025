import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { GestionProductosService, Producto } from '../services/gestion-productos.service';
import { CarritoService } from '../services/carrito';
import Swal from 'sweetalert2';

/**
 * @component TiendaComponent
 * Página pública que muestra todos los productos activos y permite añadirlos al carrito.
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

  // --- PROPIEDADES ---
  /**
   * Observable que contiene la lista de productos activos.
   * La plantilla se suscribirá a este observable usando el pipe 'async'.
   */
  productos$!: Observable<Producto[]>;

  ngOnInit(): void {
    // Al iniciar el componente, obtenemos el stream de productos activos.
    this.productos$ = this.productosService.obtenerProductosActivos();
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
