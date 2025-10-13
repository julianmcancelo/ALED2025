import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * SERVICIO GEMINI AI PARA ANÁLISIS DE PRODUCTOS - ALED2025
 * ========================================================
 * 
 * Integración completa con Google Gemini 2.5 Flash para análisis automático
 * de productos mediante reconocimiento visual y generación de contenido.
 * 
 * FUNCIONALIDADES:
 * - Análisis visual de productos
 * - Generación automática de nombres comerciales
 * - Descripciones optimizadas para e-commerce
 * - Sugerencias de precios para mercado argentino
 * - Categorización automática inteligente
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 */

export interface ResultadoGemini {
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  tags: string[];
  justificacion_precio: string;
  confianza: number;
}

export interface ConfiguracionGemini {
  apiKey: string;
  modelo: string;
  endpoint: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAiService {
  
  // Configuración de Gemini AI
  private readonly configuracion: ConfiguracionGemini = {
    apiKey: 'AIzaSyAeA9QPqiZjt5UjYDDcsqu04BF9y0WociY', // API Key de Gemini actualizada
    modelo: 'gemini-2.0-flash-exp', // Gemini 2.0 Flash más reciente
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  };

  constructor(private http: HttpClient) {
    console.log('🤖 Inicializando GeminiAiService para ALED2025...');
    console.log('🚀 Modelo: Gemini 2.0 Flash Experimental (más reciente y potente)');
    console.log('🔑 API Key configurada:', this.configuracion.apiKey ? '✅ Disponible' : '❌ No configurada');
  }

  /**
   * ANÁLISIS COMPLETO DE PRODUCTO CON GEMINI 2.0 FLASH
   * ===================================================
   * 
   * Utiliza el modelo más reciente de Google Gemini 2.0 Flash para:
   * - Análisis visual avanzado de productos
   * - Generación de contenido comercial optimizado
   * - Precios competitivos para mercado argentino 2025
   * - Categorización inteligente automática
   * - Tags SEO especializados para e-commerce
   * - Justificación detallada basada en análisis visual
   * 
   * @param imagenBase64 - Imagen del producto en formato Base64
   * @param tipoAnalisis - Tipo de análisis: 'completo', 'descripcion', 'precio'
   * @returns Observable con los datos generados por Gemini Pro
   */
  analizarProducto(imagenBase64: string, tipoAnalisis: 'completo' | 'descripcion' | 'precio' = 'completo'): Observable<ResultadoGemini> {
    console.log('🔍 Iniciando análisis de producto con Gemini AI...');
    console.log('📊 Tipo de análisis:', tipoAnalisis);

    const prompt = this.generarPrompt(tipoAnalisis);
    const payload = this.crearPayload(imagenBase64, prompt);
    return this.enviarSolicitudGemini(payload).pipe(
      map(response => this.procesarRespuestaGemini(response)),
      catchError(error => this.manejarErrorGemini(error))
    );
  }

  /**
   * Genera el prompt optimizado según el tipo de análisis
   */
  private generarPrompt(tipoAnalisis: 'completo' | 'descripcion' | 'precio'): string {
    const promptsBase: Record<'completo' | 'descripcion' | 'precio', string> = {
      completo: `
ERES UN EXPERTO EN E-COMMERCE ARGENTINO 2025. Analiza esta imagen de producto y genera datos REALES para venta online.

ANÁLISIS REQUERIDO:
1. **nombre**: Nombre comercial atractivo que genere conversión (máximo 60 caracteres)
2. **descripcion**: Descripción persuasiva enfocada en beneficios y valor (120-180 palabras)
3. **categoria**: Categoría exacta (Electrónicos, Hogar, Ropa, Deportes, Belleza, Libros, Juguetes, Automotor, Salud)
4. **precio**: Precio REAL en pesos argentinos 2025 (considera inflación y mercado actual)
5. **tags**: 5-8 palabras clave SEO para Argentina (incluye sinónimos locales)
6. **justificacion_precio**: Análisis detallado del precio vs competencia (60-100 palabras)
7. **confianza**: Nivel de certeza del análisis (0-100)

PRECIOS ARGENTINA 2025:
- Electrónicos básicos: $50.000-200.000
- Electrodomésticos: $100.000-500.000
- Ropa: $15.000-80.000
- Hogar/Decoración: $20.000-150.000
- Deportes: $25.000-120.000

LENGUAJE COMERCIAL ARGENTINO:
- Usa términos locales (ej: "barbijo" no "mascarilla")
- Enfatiza "cuotas sin interés" y "envío gratis"
- Menciona garantía y calidad
- Apela a la practicidad y durabilidad

FORMATO JSON OBLIGATORIO:
{
  "nombre": "Nombre comercial específico",
  "descripcion": "Descripción persuasiva completa con beneficios claros...",
  "categoria": "Categoría exacta",
  "precio": 85000,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "justificacion_precio": "Análisis detallado considerando mercado argentino 2025...",
  "confianza": 92
}
      `,
      descripcion: `
Genera descripción comercial persuasiva para Argentina 2025 (60-100 palabras).
Incluye beneficios, calidad, "cuotas sin interés", "envío gratis".

Responde SOLO JSON:
{
  "descripcion": "Descripción comercial atractiva...",
  "confianza": 90
}
      `,
      precio: `
Analiza imagen y sugiere precio competitivo para Argentina 2025.
Rangos: Electrónicos $50k-200k, Ropa $15k-80k, Hogar $20k-150k.

Responde SOLO JSON:
{
  "precio": 85000,
  "justificacion_precio": "Análisis vs competencia argentina (30-50 palabras)",
  "confianza": 85
}
      `
    };

    return promptsBase[tipoAnalisis] || promptsBase.completo;
  }

  /**
   * Crea el payload para la API de Gemini con validación mejorada
   */
  private crearPayload(imagenBase64: string, prompt: string): any {
    console.log('🔧 Creando payload para Gemini 2.5 Flash...');
    
    // Detectar el tipo MIME de la imagen
    let mimeType = 'image/jpeg'; // Por defecto
    let imageData = imagenBase64;
    
    // Si la imagen viene con el prefijo data:image, extraer el tipo MIME
    const mimeMatch = imagenBase64.match(/^data:(image\/[a-z]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      imageData = imagenBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      console.log('🎯 Tipo MIME detectado:', mimeType);
    } else {
      // Si no tiene prefijo, asumir que es Base64 puro
      console.log('📝 Imagen sin prefijo, usando MIME por defecto:', mimeType);
    }
    
    // Validar que tenemos datos de imagen
    if (!imageData || imageData.length < 100) {
      throw new Error('Datos de imagen inválidos o muy pequeños');
    }
    
    console.log('📊 Tamaño de imagen Base64:', imageData.length, 'caracteres');
    console.log('🎨 Tipo MIME final:', mimeType);
    
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Gemini 2.0 Flash es más potente
        candidateCount: 1,
        stopSequences: []
      },
      safetySettings: [
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
      ]
    };
    
    console.log('✅ Payload creado exitosamente');
    return payload;
  }

  /**
   * Envía la solicitud a la API de Gemini
   */
  private enviarSolicitudGemini(payload: any): Observable<any> {
    const url = `${this.configuracion.endpoint}/${this.configuracion.modelo}:generateContent?key=${this.configuracion.apiKey}`;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('🚀 Enviando solicitud a Gemini 2.0 Flash API...');
    console.log('🌐 Endpoint:', url.split('?')[0]);
    console.log('📦 Payload enviado:', JSON.stringify(payload, null, 2));
    console.log('📋 Headers:', headers);
    
    return this.http.post(url, payload, { headers }).pipe(
      map(response => {
        console.log('✅ Respuesta HTTP recibida de Gemini 2.0 Flash:');
        console.log('📊 Status y headers:', {
          status: 'OK',
          contentType: 'application/json'
        });
        console.log('📋 Respuesta completa:', JSON.stringify(response, null, 2));
        console.log('🔍 Tipo de respuesta:', typeof response);
        console.log('🎯 Tiene candidates?', response && 'candidates' in response);
        if (response && (response as any).candidates) {
          console.log('📊 Número de candidates:', (response as any).candidates.length);
        }
        return response;
      }),
      catchError(error => {
        console.error('❌ Error HTTP en solicitud a Gemini 2.0 Flash:', error);
        console.error('❌ Status del error:', error.status);
        console.error('❌ Mensaje del error:', error.message);
        console.error('❌ Respuesta del error:', error.error);
        throw error;
      })
    );
  }

  /**
   * Procesa la respuesta de Gemini y extrae el JSON con manejo mejorado de errores
   */
  private procesarRespuestaGemini(response: any): ResultadoGemini {
    try {
      console.log('🔄 Procesando respuesta de Gemini 2.5 Flash...');
      console.log('📋 Estructura completa de respuesta:', JSON.stringify(response, null, 2));
      
      // Verificar estructura de respuesta
      if (!response) {
        throw new Error('Respuesta vacía de Gemini AI');
      }

      // Verificar si hay errores en la respuesta
      if (response.error) {
        console.error('❌ Error en respuesta de Gemini:', response.error);
        throw new Error(`Error de Gemini API: ${response.error.message || 'Error desconocido'}`);
      }

      if (!response.candidates) {
        console.error('❌ No hay candidates en la respuesta:', response);
        // Verificar si hay información adicional sobre por qué no hay candidatos
        if (response.promptFeedback) {
          console.error('📋 Feedback del prompt:', response.promptFeedback);
          if (response.promptFeedback.blockReason) {
            throw new Error(`Contenido bloqueado por seguridad: ${response.promptFeedback.blockReason}`);
          }
        }
        throw new Error('No se recibieron candidatos en la respuesta de Gemini');
      }

      if (!Array.isArray(response.candidates) || response.candidates.length === 0) {
        console.error('❌ Candidates vacío o no es array:', response.candidates);
        throw new Error('Array de candidatos vacío en la respuesta');
      }

      // Verificación adicional para el primer candidato
      const candidate = response.candidates[0];
      if (!candidate) {
        console.error('❌ El primer candidato es undefined:', response.candidates);
        throw new Error('El primer candidato en la respuesta es undefined');
      }

      console.log('🎯 Primer candidato:', candidate);

      // Verificar si el candidato fue bloqueado por seguridad
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.error('❌ Candidato bloqueado:', candidate.finishReason);
        const razonBloqueo = candidate.finishReason;
        throw new Error(`Respuesta bloqueada por seguridad: ${razonBloqueo}`);
      }

      if (!candidate.content) {
        console.error('❌ Candidato sin content:', candidate);
        throw new Error('Candidato sin contenido en la respuesta');
      }

      if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        console.error('❌ Content sin parts:', candidate.content);
        throw new Error('Contenido sin partes en la respuesta');
      }

      const part = candidate.content.parts[0];
      if (!part || !part.text) {
        console.error('❌ Part sin text:', part);
        throw new Error('Parte sin texto en la respuesta');
      }

      const contenido = part.text.trim();
      console.log('📝 Contenido recibido:', contenido);

      // Intentar extraer JSON del contenido con múltiples patrones
      let jsonMatch = contenido.match(/\{[\s\S]*\}/);
      
      // Si no encuentra JSON con el patrón básico, intentar con patrones más específicos
      if (!jsonMatch) {
        // Buscar JSON entre ```json y ```
        jsonMatch = contenido.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1]; // Usar el grupo capturado
        }
      }
      
      if (!jsonMatch) {
        // Buscar JSON entre ``` y ```
        jsonMatch = contenido.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1]; // Usar el grupo capturado
        }
      }

      if (!jsonMatch) {
        console.error('❌ No se encontró JSON en el contenido:', contenido);
        console.log('🔍 Intentando extraer información manualmente...');
        
        // Como fallback, crear un resultado básico si no hay JSON
        return {
          nombre: 'Producto detectado',
          descripcion: 'No se pudo procesar completamente la imagen',
          precio: 50000,
          categoria: 'General',
          tags: ['producto'],
          justificacion_precio: 'Precio estimado por defecto',
          confianza: 30
        };
      }

      console.log('🔍 JSON extraído:', jsonMatch[0]);
      
      let resultado: ResultadoGemini;
      try {
        resultado = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        console.log('📝 JSON problemático:', jsonMatch[0]);
        
        // Intentar limpiar el JSON y parsearlo de nuevo
        const jsonLimpio = jsonMatch[0]
          .replace(/,\s*}/g, '}') // Remover comas finales
          .replace(/,\s*]/g, ']') // Remover comas finales en arrays
          .replace(/'/g, '"'); // Reemplazar comillas simples por dobles
        
        try {
          resultado = JSON.parse(jsonLimpio);
        } catch (secondParseError) {
          console.error('❌ Error en segundo intento de parseo:', secondParseError);
          throw new Error('No se pudo parsear el JSON de la respuesta de Gemini');
        }
      }
      
      // Validar que el resultado tenga las propiedades mínimas requeridas
      if (!resultado.nombre || !resultado.precio) {
        console.warn('⚠️ Resultado incompleto, completando campos faltantes...');
        resultado.nombre = resultado.nombre || 'Producto sin nombre';
        resultado.precio = resultado.precio || 50000;
        resultado.descripcion = resultado.descripcion || 'Descripción no disponible';
        resultado.categoria = resultado.categoria || 'General';
        resultado.tags = resultado.tags || ['producto'];
        resultado.confianza = resultado.confianza || 50;
      }
      
      console.log('✅ Análisis completado exitosamente:', resultado);
      return resultado;

    } catch (error) {
      console.error('❌ Error procesando respuesta:', error);
      console.error('❌ Respuesta original que causó el error:', response);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error procesando respuesta de Gemini: ${errorMessage}`);
    }
  }

  /**
   * Maneja errores de la API de Gemini - SIN SIMULACIONES
   */
  private manejarErrorGemini(error: unknown): Observable<ResultadoGemini> {
    console.error('❌ Error en Gemini AI:', error);
    
    // Determinar tipo de error específico
    let mensajeError = 'Error desconocido en Gemini AI';
    
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as any;
      switch (httpError.status) {
        case 400:
          mensajeError = 'Solicitud inválida. Verifica la imagen y el formato.';
          break;
        case 401:
          mensajeError = 'API Key inválida o expirada. Contacta al administrador.';
          break;
        case 403:
          mensajeError = 'Acceso denegado. Verifica los permisos de la API Key.';
          break;
        case 429:
          mensajeError = 'Límite de solicitudes excedido. Intenta nuevamente en unos minutos.';
          break;
        case 500:
          mensajeError = 'Error interno del servidor de Gemini. Intenta más tarde.';
          break;
        default:
          mensajeError = `Error HTTP ${httpError.status}: ${httpError.message || 'Error de conexión'}`;
      }
    }

    // NO HAY FALLBACK - Error real se propaga
    throw new Error(`Gemini AI Error: ${mensajeError}`);
  }

  /**
   * Verifica si la API de Gemini está configurada correctamente
   */
  verificarConfiguracion(): boolean {
    const configurada = !!this.configuracion.apiKey && this.configuracion.apiKey.length > 10;
    console.log('🔍 Configuración de Gemini:', configurada ? '✅ Válida' : '❌ Incompleta');
    return configurada;
  }

  /**
   * Obtiene información sobre el estado del servicio
   */
  obtenerEstadoServicio(): { configurado: boolean; modelo: string; endpoint: string } {
    return {
      configurado: this.verificarConfiguracion(),
      modelo: this.configuracion.modelo,
      endpoint: this.configuracion.endpoint
    };
  }

  /**
   * Método de prueba simple para verificar la conectividad con Gemini AI
   */
  probarConexion(): Observable<boolean> {
    console.log('🧪 Probando conexión con Gemini AI...');
    
    if (!this.verificarConfiguracion()) {
      console.error('❌ Configuración inválida');
      return of(false);
    }
    
    // Usar modelo configurado para prueba
    const url = `${this.configuracion.endpoint}/${this.configuracion.modelo}:generateContent?key=${this.configuracion.apiKey}`;
    
    const payloadMinimo = {
      contents: [
        {
          parts: [
            {
              text: "Hola"
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1,
        candidateCount: 1
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('🌐 URL de prueba:', url.split('?')[0]);
    console.log('📦 Payload mínimo:', JSON.stringify(payloadMinimo, null, 2));
    
    return this.http.post(url, payloadMinimo, { headers }).pipe(
      map(response => {
        console.log('✅ Prueba de conexión exitosa:', response);
        return true;
      }),
      catchError(error => {
        console.error('❌ Error en prueba de conexión:', error);
        console.error('❌ Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return of(false);
      })
    );
  }

  /**
   * Método alternativo usando solo texto (sin imágenes)
   */
  analizarTexto(descripcionProducto: string): Observable<any> {
    console.log('📝 Analizando producto por texto...');
    
    const url = `${this.configuracion.endpoint}/${this.configuracion.modelo}:generateContent?key=${this.configuracion.apiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Analiza este producto: "${descripcionProducto}". 
              
              Responde JSON:
              {
                "nombre": "Nombre comercial",
                "categoria": "Electrónicos",
                "precio": 50000,
                "confianza": 80
              }`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
        candidateCount: 1
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(url, payload, { headers }).pipe(
      map(response => {
        console.log('✅ Análisis de texto exitoso:', response);
        return this.procesarRespuestaGemini(response);
      }),
      catchError(error => {
        console.error('❌ Error en análisis de texto:', error);
        return this.manejarErrorGemini(error);
      })
    );
  }
}
