import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GestionProductosService, Producto } from '../services/gestion-productos.service';
import { CarritoService } from '../services/carrito';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css'],
})
export class DetalleProductoComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);

  producto$!: Observable<Producto | null>;

  ngOnInit(): void {
    // Usamos el 'paramMap' del router para obtener el 'id' de la URL.
    // 'switchMap' nos permite cambiar de un observable (los params) a otro (el producto).
    this.producto$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.productosService.obtenerProductoPorId(id);
        }
        return new Observable<null>(sub => sub.next(null)); // Devuelve null si no hay ID
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
}
