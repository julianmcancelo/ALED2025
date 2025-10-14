import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';
import { CarritoService } from '../servicios/carrito';

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
  agregandoAlCarrito: { [key: string]: boolean } = {};

  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);
  public router = inject(Router);

  ngOnInit(): void {
    this.cargarOfertas();
  }

  /**
   * Carga productos en oferta
   */
  cargarOfertas(): void {
    console.log('🏷️ Cargando ofertas...');
    
    this.productosService.obtenerProductosActivos().subscribe({
      next: (productos: Producto[]) => {
        console.log('✅ Productos cargados:', productos);
        this.productos = productos;
        
        // Filtrar productos en oferta con criterios mejorados
        this.productosEnOferta = productos.filter(producto => {
          // Productos destacados
          if (producto.esDestacado === true) return true;
          
          // Productos con precios atractivos (menos de $80,000)
          if (producto.precio < 80000) return true;
          
          // Productos con stock limitado (menos de 10 unidades)
          if (producto.stock && producto.stock < 10) return true;
          
          return false;
        }).slice(0, 12); // Limitar a 12 ofertas
        
        console.log(`🏷️ Ofertas encontradas: ${this.productosEnOferta.length}`);
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
   * Calcula el descuento simulado basado en el precio
   */
  calcularDescuento(precio: number): number {
    if (precio < 20000) return 25;  // Productos muy baratos: 25% descuento
    if (precio < 40000) return 20;  // Productos baratos: 20% descuento
    if (precio < 60000) return 15;  // Productos medios: 15% descuento
    if (precio < 80000) return 10;  // Productos caros: 10% descuento
    return 5;                       // Productos muy caros: 5% descuento
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

  /**
   * Agrega un producto al carrito
   */
  agregarAlCarrito(producto: Producto): void {
    if (!producto.id) {
      console.error('❌ Producto sin ID');
      return;
    }

    this.agregandoAlCarrito[producto.id] = true;
    
    try {
      this.carritoService.agregarProducto(producto);
      console.log('✅ Producto agregado al carrito:', producto.nombre);
      
      // Feedback visual temporal
      setTimeout(() => {
        this.agregandoAlCarrito[producto.id!] = false;
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
      this.agregandoAlCarrito[producto.id] = false;
    }
  }

  /**
   * Verifica si un producto se está agregando al carrito
   */
  estaAgregando(producto: Producto): boolean {
    return producto.id ? this.agregandoAlCarrito[producto.id] || false : false;
  }

  /**
   * Obtiene el texto del badge de oferta
   */
  getBadgeTexto(producto: Producto): string {
    if (producto.esDestacado) return 'DESTACADO';
    if (producto.stock && producto.stock < 10) return 'ÚLTIMAS UNIDADES';
    return `${this.calcularDescuento(producto.precio)}% OFF`;
  }

  /**
   * Obtiene la clase CSS del badge
   */
  getBadgeClase(producto: Producto): string {
    if (producto.esDestacado) return 'bg-warning text-dark';
    if (producto.stock && producto.stock < 10) return 'bg-danger';
    return 'bg-success';
  }
}
