import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoriaService, Categoria } from '../servicios/categoria.service';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';
import { CarritoService } from '../servicios/carrito';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  productosDestacados: { [key: string]: Producto[] } = {};
  conteoProductos: { [key: string]: number } = {};
  cargando = true;
  agregandoAlCarrito: { [key: string]: boolean } = {};

  private categoriaService = inject(CategoriaService);
  private productosService = inject(GestionProductosService);
  private carritoService = inject(CarritoService);
  public router = inject(Router);

  ngOnInit(): void {
    this.cargarCategorias();
    
    // Métodos globales para debugging desde consola
    (window as any).crearCategoriasManual = () => {
      this.crearCategoriasDebug();
    };
    
    (window as any).probarCategorias = () => {
      console.log('🔍 [CONSOLA] Probando carga de categorías...');
      this.cargarCategorias();
    };
    
    (window as any).probarFirestore = () => {
      console.log('🔌 [CONSOLA] Probando conexión Firestore...');
      this.probarConexionFirestore();
    };
  }

  /**
   * Carga todas las categorías disponibles
   */
  cargarCategorias(): void {
    console.log('🏷️ Cargando categorías directamente...');
    
    // Cargar directamente sin verificaciones previas
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Respuesta de Firestore recibida');
        console.log('📊 Número de categorías:', categorias.length);
        console.log('📄 Datos completos:', categorias);
        
        this.categorias = categorias;
        
        if (categorias.length > 0) {
          console.log('✅ Categorías encontradas, cargando productos...');
          this.cargarProductosDestacados();
        } else {
          console.log('⚠️ No se encontraron categorías en Firestore');
          this.cargando = false;
        }
      },
      error: (error) => {
        console.error('❌ Error completo al cargar categorías:', error);
        console.error('❌ Tipo de error:', typeof error);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Código:', error.code);
        console.error('❌ Stack:', error.stack);
        this.cargando = false;
      },
      complete: () => {
        console.log('🏁 Observable de categorías completado');
      }
    });
  }

  /**
   * Carga productos destacados para cada categoría
   */
  cargarProductosDestacados(): void {
    console.log('🛍️ Cargando productos destacados por categoría...');
    
    this.productosService.obtenerProductosActivos().subscribe({
      next: (productos: Producto[]) => {
        console.log('✅ Productos cargados:', productos);
        
        // Agrupar productos por categoría y contar totales
        this.categorias.forEach(categoria => {
          const productosCategoria = productos.filter(
            (producto: Producto) => producto.categoria === categoria.nombre
          );
          
          // Guardar conteo total
          this.conteoProductos[categoria.id!] = productosCategoria.length;
          
          // Guardar productos destacados (máximo 4)
          this.productosDestacados[categoria.id!] = productosCategoria
            .filter(p => p.esDestacado || p.precio < 50000) // Priorizar destacados y baratos
            .slice(0, 4);
          
          // Si no hay destacados, tomar los primeros 4
          if (this.productosDestacados[categoria.id!].length === 0) {
            this.productosDestacados[categoria.id!] = productosCategoria.slice(0, 4);
          }
        });
        
        console.log('📊 Conteo por categoría:', this.conteoProductos);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar productos:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Navega a la tienda filtrada por categoría
   */
  verCategoria(categoria: Categoria): void {
    console.log('🔍 Navegando a categoría:', categoria.nombre);
    this.router.navigate(['/productos'], { 
      queryParams: { categoria: categoria.nombre } 
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
   * Obtiene la imagen de la categoría (primera imagen de sus productos)
   */
  obtenerImagenCategoria(categoriaId: string): string {
    const productos = this.productosDestacados[categoriaId];
    if (productos && productos.length > 0 && productos[0].imagen) {
      return productos[0].imagen;
    }
    return 'assets/images/no-image.png';
  }

  /**
   * Cuenta el total de productos en una categoría
   */
  contarProductosCategoria(categoriaId: string): number {
    return this.conteoProductos[categoriaId] || 0;
  }

  /**
   * Obtiene el ID de una categoría por su nombre
   */
  private getCategoriaId(nombre: string): string {
    const categoria = this.categorias.find(cat => cat.nombre === nombre);
    return categoria?.id || '';
  }

  /**
   * Obtiene productos destacados de forma segura
   */
  obtenerProductosDestacados(categoriaId: string): Producto[] {
    return this.productosDestacados[categoriaId] || [];
  }

  /**
   * Agrega un producto al carrito desde la vista previa
   */
  agregarAlCarrito(producto: Producto, event: Event): void {
    event.stopPropagation(); // Evitar que se active el click del contenedor
    
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
   * Obtiene el color de la categoría basado en su nombre
   */
  getColorCategoria(nombre: string): string {
    const colores = {
      'Electrónicos': '#007bff',
      'Ropa': '#e83e8c',
      'Hogar': '#28a745',
      'Deportes': '#fd7e14',
      'Belleza': '#6f42c1',
      'Libros': '#20c997',
      'Juguetes': '#ffc107',
      'Automotor': '#dc3545',
      'Salud': '#17a2b8'
    };
    return colores[nombre as keyof typeof colores] || '#6c757d';
  }

  /**
   * Obtiene el icono de la categoría basado en su nombre
   */
  getIconoCategoria(nombre: string): string {
    const iconos = {
      'Electrónicos': 'bi-phone',
      'Ropa': 'bi-bag',
      'Hogar': 'bi-house',
      'Deportes': 'bi-trophy',
      'Belleza': 'bi-heart',
      'Libros': 'bi-book',
      'Juguetes': 'bi-puzzle',
      'Automotor': 'bi-car-front',
      'Salud': 'bi-heart-pulse'
    };
    return iconos[nombre as keyof typeof iconos] || 'bi-tag';
  }

  /**
   * Método de debug para crear categorías manualmente
   */
  async crearCategoriasDebug(): Promise<void> {
    console.log('🔧 [DEBUG] Creando categorías manualmente...');
    try {
      await this.categoriaService.crearCategoriasDirecto();
      console.log('✅ [DEBUG] Categorías creadas, recargando...');
      
      // Esperar un poco y recargar
      setTimeout(() => {
        this.cargarCategorias();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [DEBUG] Error creando categorías:', error);
    }
  }

  /**
   * Método para probar conexión con Firestore
   */
  async probarConexionFirestore(): Promise<void> {
    console.log('🔌 [DEBUG] Probando conexión con Firestore...');
    await this.categoriaService.probarConexion();
  }
}
