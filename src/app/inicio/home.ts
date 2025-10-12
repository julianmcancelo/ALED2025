import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfiguracionService } from '../servicios/configuracion';
import { NovedadesService, Novedad } from '../servicios/novedades.service'; // Importar NovedadesService
import { CategoriaService, Categoria } from '../servicios/categoria.service'; // Importar CategoriaService
import { Registro } from '../auth/registro/registro';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected configuracionService = inject(ConfiguracionService);
  private novedadesService = inject(NovedadesService); // Usar NovedadesService
  private categoriaService = inject(CategoriaService); // Agregar CategoriaService
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // --- PROPIEDADES ---
  novedades$!: Observable<Novedad[]>; // Cambiar a novedades
  categorias: Categoria[] = []; // Agregar array de categorías

  ngOnInit(): void {
    // Obtener las novedades y tomar las primeras 5
    this.novedades$ = this.novedadesService
      .getNovedades()
      .pipe(map((novedades) => novedades.slice(0, 5)));
    
    // 🧪 PROBAR LECTURA DE CATEGORÍAS DESDE SUPABASE
    this.probarLecturaCategorias();
  }

  /**
   * Navega a la página de la tienda.
   */
  irATienda(): void {
    this.router.navigate(['/productos']);
  }

  /**
   * Abre el diálogo modal para el registro de un nuevo usuario.
   */
  irARegistro(): void {
    this.dialog.open(Registro);
  }

  /**
   * 🧪 MÉTODO DE PRUEBA: Leer categorías desde Supabase
   * Este método prueba la conexión y lectura de categorías
   */
  probarLecturaCategorias(): void {
    console.log('🧪 INICIANDO PRUEBA DE LECTURA DE CATEGORÍAS DESDE SUPABASE');
    console.log('==========================================================');
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ ¡ÉXITO! Categorías leídas desde Supabase:', categorias);
        console.log(`📊 Total de categorías encontradas: ${categorias.length}`);
        
        if (categorias.length > 0) {
          console.log('📂 Lista de categorías:');
          categorias.forEach((categoria, index) => {
            console.log(`  ${index + 1}. ${categoria.nombre} (ID: ${categoria.id})`);
          });
          
          console.log('📋 Detalles de la primera categoría:');
          console.table(categorias[0]);
        } else {
          console.log('⚠️ No se encontraron categorías en la base de datos');
          console.log('💡 Puedes crear categorías desde el panel de administración');
        }
        
        // Guardar en la propiedad del componente
        this.categorias = categorias;
        
        console.log('🎯 PRUEBA COMPLETADA EXITOSAMENTE');
        console.log('================================');
      },
      error: (error) => {
        console.error('❌ ERROR leyendo categorías desde Supabase:', error);
        console.error('📋 Detalles del error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        console.log('🔧 Posibles soluciones:');
        console.log('   1. Verificar que la tabla "categorias" existe en Supabase');
        console.log('   2. Comprobar las políticas RLS (Row Level Security)');
        console.log('   3. Revisar la configuración de conexión en supabase.config.ts');
        console.log('   4. Ejecutar el script de creación de tablas');
        
        console.log('🎯 PRUEBA COMPLETADA CON ERRORES');
        console.log('===============================');
      }
    });
  }
}
