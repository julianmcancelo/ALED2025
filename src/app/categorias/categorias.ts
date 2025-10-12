import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { ProductosSupabaseService, ProductoConCategoria } from '../servicios/productos-supabase.service';

/**
 * Interfaz para representar una categoría con su información
 */
interface Categoria {
  nombre: string;
  cantidad: number;
  imagen: string;
  descripcion: string;
}

/**
 * @component CategoriasComponent
 * Componente que muestra todas las categorías disponibles con sus productos
 * Permite navegar a la tienda filtrada por categoría específica
 */
@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css'],
})
export class CategoriasComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private productosService = inject(ProductosSupabaseService);
  protected router = inject(Router);

  // --- PROPIEDADES ---
  /**
   * Observable que contiene las categorías con su información
   */
  categorias$!: Observable<Categoria[]>;

  /**
   * Total de productos activos
   */
  totalProductos: number = 0;

  ngOnInit(): void {
    console.log('📂 Inicializando componente Categorías...');
    
    // Obtenemos las categorías basadas en los productos activos
    this.categorias$ = this.productosService.obtenerProductosActivos().pipe(
      map(productos => {
        this.totalProductos = productos.length;
        console.log(`📊 Procesando ${productos.length} productos para categorías`);
        
        // Agrupamos productos por categoría
        const categoriasMap = new Map<string, ProductoConCategoria[]>();
        
        productos.forEach((producto: ProductoConCategoria) => {
          const categoriaNombre = producto.categoria?.nombre || 'Sin categoría';
          if (!categoriasMap.has(categoriaNombre)) {
            categoriasMap.set(categoriaNombre, []);
          }
          categoriasMap.get(categoriaNombre)!.push(producto);
        });

        // Convertimos a array de categorías con información
        const categorias: Categoria[] = Array.from(categoriasMap.entries()).map(([nombre, productos]) => {
          // Seleccionamos una imagen representativa (del primer producto)
          const imagenRepresentativa = productos[0]?.imagen_url || 'https://via.placeholder.com/300x200/0077b6/ffffff?text=' + encodeURIComponent(nombre);
          
          return {
            nombre,
            cantidad: productos.length,
            imagen: imagenRepresentativa,
            descripcion: this.obtenerDescripcionCategoria(nombre, productos.length)
          };
        });

        // Ordenamos por cantidad de productos (descendente)
        categorias.sort((a, b) => b.cantidad - a.cantidad);
        
        console.log(`✅ ${categorias.length} categorías procesadas:`, categorias.map(c => `${c.nombre} (${c.cantidad})`));
        
        return categorias;
      })
    );
  }

  /**
   * Navega a la tienda filtrada por la categoría seleccionada
   * @param categoria - Nombre de la categoría a filtrar
   */
  verProductosDeCategoria(categoria: string): void {
    console.log(`🔍 Navegando a productos de categoría: ${categoria}`);
    this.router.navigate(['/productos'], { 
      queryParams: { buscar: categoria } 
    });
  }

  /**
   * Obtiene una descripción personalizada para cada categoría
   * @param categoria - Nombre de la categoría
   * @param cantidad - Cantidad de productos en la categoría
   * @returns Descripción de la categoría
   */
  private obtenerDescripcionCategoria(categoria: string, cantidad: number): string {
    const descripciones: { [key: string]: string } = {
      'Electrónicos': 'Tecnología de última generación para tu hogar y trabajo',
      'Hogar': 'Todo lo que necesitas para hacer tu hogar más cómodo',
      'Ropa': 'Moda y estilo para todas las ocasiones',
      'Deportes': 'Equipamiento deportivo para mantenerte activo',
      'Libros': 'Conocimiento y entretenimiento en cada página',
      'Juguetes': 'Diversión garantizada para todas las edades'
    };

    return descripciones[categoria] || `Descubre nuestra selección de productos de ${categoria.toLowerCase()}`;
  }

  /**
   * Maneja el error cuando una imagen no se puede cargar
   * @param event - El evento de error de la imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Categoría';
  }
}
