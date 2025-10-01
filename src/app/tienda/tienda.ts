import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
}
