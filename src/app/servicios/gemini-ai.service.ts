import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, retry, switchMap } from 'rxjs/operators';

/**
 * SERVICIO DE GOOGLE AI GEMINI 2.5 FLASH PARA ALED2025
 * ====================================================
 * 
 * Servicio especializado para integración con Google AI Gemini 2.5 Flash
 * Incluye análisis de imágenes, generación de contenido y procesamiento inteligente
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

export interface GeminiResponse {
  success: boolean;
  content?: string;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface ProductAnalysis {
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  tags: string[];
  justificacionPrecio: string;
  caracteristicas: string[];
  ventajas: string[];
  usoRecomendado: string[];
}

export interface ImageAnalysis {
  descripcion: string;
  coloresPrincipales: string[];
  objetos: string[];
  calidad: 'alta' | 'media' | 'baja';
  recomendaciones: string[];
  esProducto: boolean;
  categoriaDetectada?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAIService {

  // 🔑 CONFIGURACIÓN DE GEMINI AI 2.5 FLASH
  private readonly GEMINI_API_KEY = 'AIzaSyC6hXiQ_ihLBRBeu1S8nPcdVxpJc26p0-I';
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  private readonly GEMINI_MODEL = 'gemini-2.0-flash-exp';

  // 🎯 CONFIGURACIÓN DE GENERACIÓN
  private readonly GENERATION_CONFIG = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
    responseMimeType: "application/json"
  };

  // 🛡️ CONFIGURACIÓN DE SEGURIDAD
  private readonly SAFETY_SETTINGS = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH", 
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ];

  constructor() {
    console.log('🤖 Inicializando Gemini AI 2.5 Flash Service...');
    this.verificarConfiguracion();
  }

  /**
   * Verifica que la configuración de la API esté correcta
   */
  private verificarConfiguracion(): void {
    if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY.length < 10) {
      console.warn('⚠️ API Key de Gemini no configurada correctamente');
    } else {
      console.log('✅ Gemini AI configurado correctamente');
    }
  }

  /**
   * Analiza una imagen de producto y genera información completa
   */
  analizarProducto(imagenBase64: string, contextoAdicional?: string): Observable<ProductAnalysis> {
    console.log('🔍 Analizando producto con Gemini 2.5 Flash...');

    const prompt = `
Analiza esta imagen de producto para un e-commerce y proporciona la siguiente información en formato JSON:

{
  "nombre": "Nombre descriptivo del producto",
  "descripcion": "Descripción detallada y atractiva para e-commerce (100-200 palabras)",
  "categoria": "Categoría principal del producto",
  "precio": "Precio estimado en pesos argentinos (solo número)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "justificacionPrecio": "Explicación del precio basada en características visibles",
  "caracteristicas": ["característica1", "característica2", "característica3"],
  "ventajas": ["ventaja1", "ventaja2", "ventaja3"],
  "usoRecomendado": ["uso1", "uso2", "uso3"]
}

Contexto adicional: ${contextoAdicional || 'Ninguno'}

Instrucciones específicas:
- Sé preciso y profesional
- El precio debe ser realista para el mercado argentino
- La descripción debe ser persuasiva para ventas
- Las tags deben ser relevantes para búsquedas
- Enfócate en beneficios y características visibles
`;

    return this.enviarSolicitud(prompt, imagenBase64).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error en análisis de producto');
        }

        try {
          const analisis = JSON.parse(response.content || '{}');
          return {
            nombre: analisis.nombre || 'Producto sin nombre',
            descripcion: analisis.descripcion || 'Descripción no disponible',
            categoria: analisis.categoria || 'Sin categoría',
            precio: Number(analisis.precio) || 0,
            tags: Array.isArray(analisis.tags) ? analisis.tags : [],
            justificacionPrecio: analisis.justificacionPrecio || '',
            caracteristicas: Array.isArray(analisis.caracteristicas) ? analisis.caracteristicas : [],
            ventajas: Array.isArray(analisis.ventajas) ? analisis.ventajas : [],
            usoRecomendado: Array.isArray(analisis.usoRecomendado) ? analisis.usoRecomendado : []
          };
        } catch (error) {
          console.error('❌ Error parseando respuesta JSON:', error);
          throw new Error('Respuesta de IA no válida');
        }
      }),
      catchError(error => {
        console.error('❌ Error en análisis de producto:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Analiza una imagen general y extrae información visual
   */
  analizarImagen(imagenBase64: string): Observable<ImageAnalysis> {
    console.log('🖼️ Analizando imagen con Gemini 2.5 Flash...');

    const prompt = `
Analiza esta imagen y proporciona información detallada en formato JSON:

{
  "descripcion": "Descripción detallada de lo que se ve en la imagen",
  "coloresPrincipales": ["color1", "color2", "color3"],
  "objetos": ["objeto1", "objeto2", "objeto3"],
  "calidad": "alta|media|baja",
  "recomendaciones": ["recomendación1", "recomendación2"],
  "esProducto": true/false,
  "categoriaDetectada": "categoría si es un producto"
}

Instrucciones:
- Sé específico en la descripción
- Identifica colores dominantes
- Lista objetos principales visibles
- Evalúa la calidad de la imagen
- Determina si es una imagen de producto comercial
- Proporciona recomendaciones para mejorar la imagen
`;

    return this.enviarSolicitud(prompt, imagenBase64).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error en análisis de imagen');
        }

        try {
          const analisis = JSON.parse(response.content || '{}');
          return {
            descripcion: analisis.descripcion || 'Sin descripción',
            coloresPrincipales: Array.isArray(analisis.coloresPrincipales) ? analisis.coloresPrincipales : [],
            objetos: Array.isArray(analisis.objetos) ? analisis.objetos : [],
            calidad: analisis.calidad || 'media',
            recomendaciones: Array.isArray(analisis.recomendaciones) ? analisis.recomendaciones : [],
            esProducto: Boolean(analisis.esProducto),
            categoriaDetectada: analisis.categoriaDetectada
          };
        } catch (error) {
          console.error('❌ Error parseando respuesta JSON:', error);
          throw new Error('Respuesta de IA no válida');
        }
      }),
      catchError(error => {
        console.error('❌ Error en análisis de imagen:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Genera contenido de texto usando Gemini
   */
  generarContenido(prompt: string): Observable<string> {
    console.log('✍️ Generando contenido con Gemini 2.5 Flash...');

    return this.enviarSolicitud(prompt).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error generando contenido');
        }
        return response.content || '';
      }),
      catchError(error => {
        console.error('❌ Error generando contenido:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mejora la descripción de un producto existente
   */
  mejorarDescripcionProducto(nombreProducto: string, descripcionActual: string, categoria: string): Observable<string> {
    console.log('🚀 Mejorando descripción de producto...');

    const prompt = `
Mejora esta descripción de producto para e-commerce:

Producto: ${nombreProducto}
Categoría: ${categoria}
Descripción actual: ${descripcionActual}

Genera una descripción mejorada que sea:
- Más atractiva y persuasiva
- Optimizada para SEO
- Entre 150-250 palabras
- Enfocada en beneficios
- Con llamada a la acción

Responde solo con la descripción mejorada, sin formato JSON.
`;

    return this.generarContenido(prompt);
  }

  /**
   * Envía una solicitud a la API de Gemini
   */
  private enviarSolicitud(prompt: string, imagenBase64?: string): Observable<GeminiResponse> {
    if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY.length < 10) {
      return throwError(() => new Error('API Key de Gemini no configurada'));
    }

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          ...(imagenBase64 ? [{
            inline_data: {
              mime_type: this.detectarMimeType(imagenBase64),
              data: imagenBase64.replace(/^data:image\/[a-z]+;base64,/, '')
            }
          }] : [])
        ]
      }],
      generationConfig: this.GENERATION_CONFIG,
      safetySettings: this.SAFETY_SETTINGS
    };

    return from(fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })).pipe(
      retry(2), // Reintentar hasta 2 veces en caso de error
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return from(response.json());
      }),
      map((data: any) => {
        console.log('📊 Respuesta de Gemini recibida:', data);

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const content = data.candidates[0].content.parts[0].text;
          
          return {
            success: true,
            content: content,
            data: data,
            usage: data.usageMetadata ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              candidatesTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0
            } : undefined
          };
        }

        // Manejar errores de la API
        if (data.error) {
          throw new Error(`Error de Gemini API: ${data.error.message}`);
        }

        throw new Error('Respuesta inválida de Gemini AI');
      }),
      catchError(error => {
        console.error('❌ Error en solicitud a Gemini:', error);
        return from([{
          success: false,
          error: error.message || 'Error desconocido en Gemini AI'
        }]);
      })
    );
  }

  /**
   * Detecta el tipo MIME de una imagen base64
   */
  private detectarMimeType(base64: string): string {
    if (base64.startsWith('data:image/')) {
      const match = base64.match(/data:image\/([a-z]+);base64,/);
      return match ? `image/${match[1]}` : 'image/jpeg';
    }
    return 'image/jpeg'; // Por defecto
  }

  /**
   * Verifica si el servicio está disponible
   */
  verificarDisponibilidad(): Observable<boolean> {
    console.log('🔍 Verificando disponibilidad de Gemini AI...');

    return this.generarContenido('Responde solo con "OK" si puedes procesar esta solicitud.').pipe(
      map(response => {
        const disponible = response.toLowerCase().includes('ok');
        console.log(disponible ? '✅ Gemini AI disponible' : '❌ Gemini AI no disponible');
        return disponible;
      }),
      catchError(error => {
        console.error('❌ Gemini AI no disponible:', error);
        return from([false]);
      })
    );
  }

  /**
   * Obtiene información sobre el uso de tokens
   */
  obtenerEstadisticasUso(): { modelo: string; configuracion: any } {
    return {
      modelo: this.GEMINI_MODEL,
      configuracion: this.GENERATION_CONFIG
    };
  }
}
