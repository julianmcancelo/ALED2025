import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoriaService, Categoria } from '../servicios/categoria.service';
import { GestionProductosService, Producto } from '../servicios/gestion-productos.service';

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
  cargando = true;

  constructor(
    private categoriaService: CategoriaService,
    private productosService: GestionProductosService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  /**
   * Carga todas las categorías disponibles
   */
  cargarCategorias(): void {
    console.log('🏷️ Cargando categorías...');
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas:', categorias);
        this.categorias = categorias;
        this.cargarProductosDestacados();
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Carga productos destacados para cada categoría
   */
  cargarProductosDestacados(): void {
    console.log('🛍️ Cargando productos destacados por categoría...');
    
    this.productosService.obtenerProductos().subscribe({
      next: (productos: Producto[]) => {
        console.log('✅ Productos cargados:', productos);
        
        // Agrupar productos por categoría (máximo 3 por categoría)
        this.categorias.forEach(categoria => {
          this.productosDestacados[categoria.id!] = productos
            .filter((producto: Producto) => producto.categoria === categoria.nombre)
            .slice(0, 3); // Solo los primeros 3 productos
        });
        
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
  contarProductosCategoria(categoriaNombre: string): number {
    // Esto se podría optimizar con un servicio específico
    return this.productosDestacados[this.getCategoriaId(categoriaNombre)]?.length || 0;
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
}
