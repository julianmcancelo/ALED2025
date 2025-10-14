import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';
import { CarritoService } from '../servicios/carrito';
import { ResenasComponent } from '../shared/resenas/resenas.component';
import { ConfiguracionService } from '../servicios/configuracion';
import { ResenasService, EstadisticasVendedor } from '../servicios/resenas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, ResenasComponent],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css'],
})
export class DetalleProductoComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);
  public configuracionService = inject(ConfiguracionService);
  private resenasService = inject(ResenasService);

  producto$!: Observable<Producto | null>;
  estadisticasVendedor: EstadisticasVendedor | null = null;
  
  // Exponer Math para usar en template
  Math = Math;

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

    // Cargar estadísticas reales del vendedor
    this.cargarEstadisticasVendedor();
  }

  /**
   * Carga las estadísticas reales del vendedor desde Firestore
   */
  private cargarEstadisticasVendedor(): void {
    this.resenasService.obtenerEstadisticasVendedor().subscribe({
      next: (estadisticas) => {
        this.estadisticasVendedor = estadisticas;
        console.log(' Estadísticas del vendedor cargadas:', estadisticas);
      },
      error: (error) => {
        console.error(' Error cargando estadísticas del vendedor:', error);
        // Valores por defecto en caso de error
        this.estadisticasVendedor = {
          nombre: 'ALED2025 Store',
          reputacion: 'MercadoLíder',
          calificacionPromedio: 4.8,
          totalVentas: 2847,
          totalResenas: 0,
          fechaRegistro: new Date('2020-03-15'),
          porcentajePositivas: 98.5
        };
      }
    });
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
