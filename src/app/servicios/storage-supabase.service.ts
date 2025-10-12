import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { supabase, STORAGE_BUCKETS } from '../config/supabase.config';
import { GeminiAIService, ProductAnalysis, ImageAnalysis } from './gemini-ai.service';

/**
 * SERVICIO DE ALMACENAMIENTO CON SUPABASE STORAGE PARA ALED2025
 * =============================================================
 * 
 * Servicio que maneja el almacenamiento de imágenes usando Supabase Storage
 * Incluye funcionalidades de Gemini AI 2.5 Flash para procesamiento de imágenes
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

export interface RespuestaUpload {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface RespuestaIA {
  success: boolean;
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  precio?: number;
  tags?: string[];
  justificacionPrecio?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageSupabaseService {
  
  // 🤖 SERVICIO DE GEMINI AI 2.5 FLASH
  private geminiService = inject(GeminiAIService);

  constructor() {
    console.log('📁 Inicializando StorageSupabaseService con Gemini AI 2.5 Flash...');
  }

  // 📁 MÉTODOS DE ALMACENAMIENTO

  /**
   * Sube una imagen a Supabase Storage
   */
  subirImagen(archivo: File, carpeta: string = 'productos'): Observable<RespuestaUpload> {
    console.log(`📁 Subiendo imagen: ${archivo.name} a ${carpeta}`);
    
    const validacion = this.validarArchivo(archivo);
    if (!validacion.valido) {
      return from([{
        success: false,
        error: validacion.error
      }]);
    }

    const nombreArchivo = this.sanitizarNombre(archivo.name);
    const timestamp = Date.now();
    const path = `${carpeta}/${timestamp}_${nombreArchivo}`;

    return from(supabase.storage
      .from(STORAGE_BUCKETS.PRODUCTOS)
      .upload(path, archivo, {
        cacheControl: '3600',
        upsert: false
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error subiendo imagen:', error);
          return {
            success: false,
            error: error.message
          };
        }

        console.log('✅ Imagen subida exitosamente:', data.path);
        
        const publicUrl = this.obtenerUrlPublica(data.path);
        return {
          success: true,
          url: publicUrl,
          path: data.path
        };
      }),
      catchError(error => {
        console.error('❌ Error en subirImagen:', error);
        return from([{
          success: false,
          error: 'Error subiendo imagen'
        }]);
      })
    );
  }

  /**
   * Elimina una imagen de Supabase Storage
   */
  eliminarImagen(path: string): Observable<boolean> {
    console.log('🗑️ Eliminando imagen:', path);
    
    return from(supabase.storage
      .from(STORAGE_BUCKETS.PRODUCTOS)
      .remove([path])
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('❌ Error eliminando imagen:', error);
          return false;
        }
        
        console.log('✅ Imagen eliminada exitosamente');
        return true;
      }),
      catchError(error => {
        console.error('❌ Error en eliminarImagen:', error);
        return from([false]);
      })
    );
  }

  /**
   * Obtiene la URL pública de una imagen
   */
  obtenerUrlPublica(path: string): string {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.PRODUCTOS)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // 🤖 MÉTODOS DE GEMINI AI 2.5 FLASH

  /**
   * Analiza una imagen con Gemini AI 2.5 Flash y extrae información del producto
   */
  analizarConGemini(archivo: File, contextoAdicional?: string): Observable<RespuestaIA> {
    console.log('🤖 Analizando imagen con Gemini AI 2.5 Flash...');
    
    return this.convertirABase64(archivo).pipe(
      switchMap(base64 => this.geminiService.analizarProducto(base64, contextoAdicional)),
      map((analisis: ProductAnalysis) => {
        return {
          success: true,
          nombre: analisis.nombre,
          descripcion: analisis.descripcion,
          categoria: analisis.categoria,
          precio: analisis.precio,
          tags: analisis.tags,
          justificacionPrecio: analisis.justificacionPrecio
        };
      }),
      catchError((error) => {
        console.error('❌ Error en análisis Gemini:', error);
        return from([{
          success: false,
          error: error.message || 'Error conectando con Gemini AI'
        }]);
      })
    );
  }

  /**
   * Analiza una imagen general con Gemini AI 2.5 Flash
   */
  analizarImagenGeneral(archivo: File): Observable<ImageAnalysis> {
    console.log('🖼️ Analizando imagen general con Gemini AI 2.5 Flash...');
    
    return this.convertirABase64(archivo).pipe(
      switchMap(base64 => this.geminiService.analizarImagen(base64)),
      catchError((error) => {
        console.error('❌ Error en análisis de imagen:', error);
        throw error;
      })
    );
  }

  /**
   * Mejora la descripción de un producto usando Gemini AI
   */
  mejorarDescripcion(nombre: string, descripcionActual: string, categoria: string): Observable<string> {
    console.log('🚀 Mejorando descripción con Gemini AI...');
    
    return this.geminiService.mejorarDescripcionProducto(nombre, descripcionActual, categoria);
  }

  /**
   * Verifica si Gemini AI está disponible
   */
  verificarGeminiDisponible(): Observable<boolean> {
    return this.geminiService.verificarDisponibilidad();
  }

  /**
   * Genera contenido usando Gemini AI
   */
  generarContenido(prompt: string): Observable<string> {
    return this.geminiService.generarContenido(prompt);
  }

  // 🛠️ MÉTODOS DE UTILIDAD

  /**
   * Valida un archivo de imagen
   */
  private validarArchivo(archivo: File): { valido: boolean; error?: string } {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(archivo.type)) {
      return {
        valido: false,
        error: 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.'
      };
    }

    if (archivo.size > tamañoMaximo) {
      return {
        valido: false,
        error: 'El archivo es demasiado grande. Máximo 5MB.'
      };
    }

    return { valido: true };
  }

  /**
   * Convierte archivo a Base64
   */
  convertirABase64(archivo: File): Observable<string> {
    return from(new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    }));
  }

  /**
   * Sanitiza nombre de archivo
   */
  private sanitizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Procesa imagen con borrado de fondo básico usando Canvas
   */
  procesarImagenConCanvas(archivo: File): Observable<RespuestaUpload> {
    console.log('🎨 Procesando imagen con Canvas...');
    
    return this.convertirABase64(archivo).pipe(
      switchMap(base64 => {
        return from(new Promise<RespuestaUpload>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Aplicar filtros básicos
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.aplicarFiltroBasico(imageData.data);
            ctx.putImageData(imageData, 0, 0);
            
            // Convertir a blob y generar URL
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve({
                  success: true,
                  url: url,
                  path: 'processed_image'
                });
              } else {
                resolve({
                  success: false,
                  error: 'Error procesando imagen'
                });
              }
            }, 'image/png');
          };
          
          img.onerror = () => {
            resolve({
              success: false,
              error: 'Error cargando imagen'
            });
          };
          
          img.src = base64;
        }));
      })
    );
  }

  /**
   * Aplica filtro básico a los datos de imagen
   */
  private aplicarFiltroBasico(data: Uint8ClampedArray): void {
    // Algoritmo básico de mejora de contraste
    for (let i = 0; i < data.length; i += 4) {
      // Aumentar contraste ligeramente
      data[i] = Math.min(255, data[i] * 1.1);     // R
      data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G
      data[i + 2] = Math.min(255, data[i + 2] * 1.1); // B
      // Alpha se mantiene igual
    }
  }
}
