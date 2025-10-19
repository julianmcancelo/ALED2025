import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';
import { CarritoService } from '../servicios/carrito';
import { ConfiguracionService } from '../servicios/configuracion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css'],
})
export class DetalleProductoComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);
  public configuracionService = inject(ConfiguracionService);

  producto$!: Observable<Producto | null>;

  ngOnInit(): void {
    // Cargar producto
    this.producto$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.productosService.obtenerProductoPorId(id);
        }
        return [];
      })
    );
  }

  /**
   * Añade el producto actual al carrito.
   */
  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto(producto);
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
   * Maneja el error cuando una imagen no se puede cargar.
   * @param event - El evento de error de la imagen.
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Alterna el estado de favorito del producto.
   * Por ahora muestra una notificación, en el futuro se podría integrar con un servicio de favoritos.
   */
  toggleFavorito(): void {
    Swal.fire({
      title: '¡Agregado a favoritos!',
      text: 'Esta funcionalidad estará disponible próximamente.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  }
}
