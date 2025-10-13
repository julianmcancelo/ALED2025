import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ofertas.html',
  styleUrls: ['./ofertas.css']
})
export class OfertasComponent implements OnInit {
  productos: Producto[] = [];
  productosEnOferta: Producto[] = [];
  cargando = true;

  constructor(
    private productosService: GestionProductosService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.cargarOfertas();
  }

  /**
   * Carga productos en oferta
   */
  cargarOfertas(): void {
    console.log('🏷️ Cargando ofertas...');
    
    this.productosService.obtenerProductos().subscribe({
      next: (productos: Producto[]) => {
        console.log('✅ Productos cargados:', productos);
        this.productos = productos;
        
        // Filtrar productos destacados como ofertas
        this.productosEnOferta = productos.filter(producto => 
          producto.esDestacado === true || 
          producto.precio < 50000 // Productos baratos como ofertas
        );
        
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar ofertas:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Navega al detalle de un producto
   */
  verProducto(producto: Producto): void {
    console.log('👀 Navegando a producto:', producto.nombre);
    this.router.navigate(['/productos', producto.id]);
  }

  /**
   * Calcula el descuento simulado
   */
  calcularDescuento(precio: number): number {
    if (precio < 30000) return 15;
    if (precio < 50000) return 10;
    return 5;
  }

  /**
   * Calcula el precio original simulado
   */
  calcularPrecioOriginal(precio: number): number {
    const descuento = this.calcularDescuento(precio);
    return Math.round(precio / (1 - descuento / 100));
  }

  /**
   * Formatea el precio en pesos argentinos
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(precio);
  }
}
