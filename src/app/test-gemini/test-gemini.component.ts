import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiAIService, ProductAnalysis, ImageAnalysis } from '../servicios/gemini-ai.service';
import { StorageSupabaseService, RespuestaIA } from '../servicios/storage-supabase.service';

/**
 * COMPONENTE DE PRUEBA PARA GEMINI AI 2.5 FLASH
 * ==============================================
 * 
 * Componente para probar y demostrar las capacidades de Gemini AI 2.5 Flash
 * Incluye análisis de productos, imágenes y generación de contenido
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 */

@Component({
  selector: 'app-test-gemini',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-gemini.component.html',
  styles: [`
    .bg-gradient {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    .card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .img-thumbnail {
      border: 2px solid #dee2e6;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .alert {
      border-left: 4px solid;
    }
    
    .alert-success {
      border-left-color: #28a745;
    }
    
    .alert-info {
      border-left-color: #17a2b8;
    }
    
    .alert-warning {
      border-left-color: #ffc107;
    }
  `]
})
export class TestGeminiComponent {
  
  // 🔧 SERVICIOS
  private geminiService = inject(GeminiAIService);
  private storageService = inject(StorageSupabaseService);
  
  // 📊 PROPIEDADES DE ESTADO
  disponibilidad = {
    disponible: false,
    verificando: false
  };
  
  // 📸 ANÁLISIS DE IMAGEN
  imagenSeleccionada: File | null = null;
  imagenPreview: string = '';
  analizando = false;
  resultadoAnalisis: RespuestaIA | null = null;
  
  // ✍️ GENERACIÓN DE CONTENIDO
  promptPersonalizado = '';
  generando = false;
  contenidoGenerado = '';
  
  // 🚀 MEJORA DE DESCRIPCIÓN
  productoMejorar = {
    nombre: '',
    categoria: '',
    descripcion: ''
  };
  mejorandoDescripcion = false;
  descripcionMejorada = '';
  
  // 📈 ESTADÍSTICAS
  estadisticas = this.geminiService.obtenerEstadisticasUso();

  ngOnInit() {
    console.log('🤖 Inicializando componente de prueba Gemini AI');
    this.verificarDisponibilidad();
  }

  /**
   * Verifica si Gemini AI está disponible
   */
  verificarDisponibilidad() {
    this.disponibilidad.verificando = true;
    
    this.geminiService.verificarDisponibilidad().subscribe({
      next: (disponible) => {
        this.disponibilidad.disponible = disponible;
        this.disponibilidad.verificando = false;
        console.log(disponible ? '✅ Gemini AI disponible' : '❌ Gemini AI no disponible');
      },
      error: (error) => {
        console.error('❌ Error verificando Gemini:', error);
        this.disponibilidad.disponible = false;
        this.disponibilidad.verificando = false;
      }
    });
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      // Limpiar resultados anteriores
      this.resultadoAnalisis = null;
    }
  }

  /**
   * Analiza el producto con Gemini AI
   */
  analizarProducto() {
    if (!this.imagenSeleccionada) return;
    
    this.analizando = true;
    this.resultadoAnalisis = null;
    
    this.storageService.analizarConGemini(this.imagenSeleccionada, 'Análisis para e-commerce argentino').subscribe({
      next: (resultado) => {
        this.analizando = false;
        if (resultado.success) {
          this.resultadoAnalisis = resultado;
          console.log('✅ Análisis completado:', resultado);
        } else {
          console.error('❌ Error en análisis:', resultado.error);
          alert('Error en el análisis: ' + resultado.error);
        }
      },
      error: (error) => {
        this.analizando = false;
        console.error('❌ Error analizando producto:', error);
        alert('Error conectando con Gemini AI: ' + error.message);
      }
    });
  }

  /**
   * Genera contenido personalizado
   */
  generarContenido() {
    if (!this.promptPersonalizado.trim()) return;
    
    this.generando = true;
    this.contenidoGenerado = '';
    
    this.geminiService.generarContenido(this.promptPersonalizado).subscribe({
      next: (contenido) => {
        this.generando = false;
        this.contenidoGenerado = contenido;
        console.log('✅ Contenido generado:', contenido);
      },
      error: (error) => {
        this.generando = false;
        console.error('❌ Error generando contenido:', error);
        alert('Error generando contenido: ' + error.message);
      }
    });
  }

  /**
   * Mejora la descripción de un producto
   */
  mejorarDescripcion() {
    if (!this.productoMejorar.nombre.trim()) return;
    
    this.mejorandoDescripcion = true;
    this.descripcionMejorada = '';
    
    this.storageService.mejorarDescripcion(
      this.productoMejorar.nombre,
      this.productoMejorar.descripcion,
      this.productoMejorar.categoria
    ).subscribe({
      next: (descripcion) => {
        this.mejorandoDescripcion = false;
        this.descripcionMejorada = descripcion;
        console.log('✅ Descripción mejorada:', descripcion);
      },
      error: (error) => {
        this.mejorandoDescripcion = false;
        console.error('❌ Error mejorando descripción:', error);
        alert('Error mejorando descripción: ' + error.message);
      }
    });
  }
}
