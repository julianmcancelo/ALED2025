import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';

/**
 * ============================================================================
 * SERVICIO DE INTEGRACIÓN CON GEMINI AI
 * ============================================================================
 * 
 * Este servicio maneja la integración con Google Gemini AI para análisis
 * inteligente de imágenes y generación de contenido para productos.
 * 
 * FUNCIONALIDADES:
 * - Análisis visual de imágenes con Gemini Vision
 * - Detección de objetos y productos
 * - Generación automática de nombres, categorías y descripciones
 * - Estimación de precios basada en análisis visual
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

export interface ResultadoAnalisisGemini {
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  caracteristicas: string[];
  especificaciones?: {
    color?: string;
    material?: string;
    tamaño?: string;
    estado?: string;
    marca?: string;
  };
  palabras_clave?: string[];
  confianza: number;
  observaciones?: string;
}

export interface ResultadoGeneracionContenido {
  titulo: string;
  descripcion: string;
  enlaceUrl: string;
  promptImagen: string;
}

export interface ImagenGenerada {
  url: string;
  nombre: string;
  tamaño: number;
  tipo: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiIAService {

  // URL base de la API de Gemini (usando modelo correcto)
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  
  // Clave API de Gemini (en producción debería estar en variables de entorno)
  private readonly API_KEY = 'AIzaSyAeA9QPqiZjt5UjYDDcsqu04BF9y0WociY'; // Reemplazar con tu API key real

  constructor(private http: HttpClient) {}
  /**
   * Analiza una imagen usando Gemini Vision AI para detectar productos.
   * Prueba diferentes modelos automáticamente si uno falla.
   * 
   * @param imagenBase64 - Imagen en formato base64
   * @returns Promise con el resultado del análisis o null si falla
   */
  async analizarImagenConGemini(imagenBase64: string): Promise<ResultadoAnalisisGemini | null> {
    console.log('🤖 Análisis de imagen solicitado');
    
    if (!this.esApiConfigurada()) {
      throw new Error('API de Gemini no configurada');
    }

    try {
      const prompt = `
Analiza esta imagen de producto para e-commerce y extrae la siguiente información:

Responde SOLO con este JSON válido:
{
  "nombre": "Nombre descriptivo del producto",
  "categoria": "Categoría del producto (Electrónicos, Ropa, Hogar, Deportes, Libros, Juguetes, Belleza, Automotriz)",
  "descripcion": "Descripción detallada del producto",
  "precio": número_estimado_en_pesos_argentinos,
  "caracteristicas": ["característica1", "característica2", "característica3"],
  "especificaciones": {
    "color": "color_principal",
    "material": "material_principal",
    "tamaño": "tamaño_estimado",
    "estado": "Nuevo",
    "marca": "marca_si_es_visible"
  },
  "palabras_clave": ["palabra1", "palabra2", "palabra3"],
  "confianza": 0.95,
  "observaciones": "Observaciones adicionales sobre el producto"
}

INSTRUCCIONES:
- Analiza cuidadosamente todos los detalles visibles
- Estima un precio realista en pesos argentinos
- Identifica la categoría más apropiada
- Extrae características principales
- Responde EXCLUSIVAMENTE con el JSON, sin texto adicional
      `;

      const response = await this.analizarConModelosDisponibles(imagenBase64, 'image/jpeg');
      return response;
      
    } catch (error) {
      console.error('Error analizando imagen:', error);
      throw error;
    }
  }

  /**
   * Método wrapper para compatibilidad
   */
  analizarImagenProducto(imagenBase64: string, mimeType: string): Observable<ResultadoAnalisisGemini> {
    return from(this.analizarImagenConGemini(imagenBase64).then(result => {
      if (result) {
        return result;
      } else {
        throw new Error('No se pudo analizar la imagen');
      }
    }));
  }
  /**
   * Analiza imagen obteniendo primero los modelos disponibles.
   */
  private async analizarConModelosDisponibles(imagenBase64: string, mimeType: string): Promise<ResultadoAnalisisGemini> {
    console.log('🔍 Obteniendo modelos disponibles de Gemini...');
    
    // Primero intentar obtener modelos disponibles
    let modelosDisponibles = await this.listarModelosDisponibles();
    
    // Si no se pueden obtener, usar lista predeterminada con modelos más recientes
    if (modelosDisponibles.length === 0) {
      console.log('⚠️ No se pudieron obtener modelos, usando lista predeterminada con Gemini 2.0/2.5');
      modelosDisponibles = [
        // Modelos Gemini 2.5 (más recientes y potentes)
        'gemini-2.5-flash-exp',
        'gemini-2.5-pro-exp',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        
        // Modelos Gemini 2.0 (muy avanzados)
        'gemini-2.0-flash-exp',
        'gemini-2.0-pro-exp', 
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        
        // Modelos Gemini 1.5 (estables como fallback)
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-1.5-flash-8b-latest', 
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-pro-vision',
        'gemini-pro'
      ];
    }

    console.log('🎯 Modelos a probar:', modelosDisponibles);
    return this.probarModelosGemini(imagenBase64, mimeType, modelosDisponibles, 0);
  }

  /**
   * Prueba diferentes modelos de Gemini recursivamente hasta encontrar uno que funcione.
   */
  private async probarModelosGemini(
    imagenBase64: string, 
    mimeType: string, 
    modelos: string[], 
    indice: number
  ): Promise<ResultadoAnalisisGemini> {
    
    if (indice >= modelos.length) {
      return this.generarRespuestaFallback();
    }

    const modeloActual = modelos[indice];
    const url = `https://generativelanguage.googleapis.com/v1/models/${modeloActual}:generateContent?key=${this.API_KEY}`;
    console.log(`🚀 Probando modelo ${indice + 1}/${modelos.length}: ${modeloActual}`);
    console.log('URL:', url);

    const prompt = this.crearPromptAnalisisProducto();
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imagenBase64.split(',')[1]
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 2048,  // Aumentado para evitar cortes
        candidateCount: 1,
        stopSequences: []
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    try {
      console.log('🖼️ Imagen base64 length:', imagenBase64.length);
      console.log('📋 MIME type:', mimeType);
      
      const response = await this.http.post<any>(url, requestBody, { headers }).toPromise();
      console.log(`✅ ¡Éxito con ${modeloActual}!`, response);
      
      // Verificar si la respuesta contiene un error
      if (response.error) {
        console.error(`❌ Error en respuesta de ${modeloActual}:`, response.error);
        throw new Error(`Error en respuesta: ${response.error.message || 'Error desconocido'}`);
      }
      
      return this.procesarRespuestaGemini(response);
      
    } catch (error: any) {
      console.error(`❌ Error con modelo ${modeloActual}:`, error.status, error.message);
      
      if (error.status === 404) {
        console.log(`⏭️ Modelo ${modeloActual} no disponible, probando siguiente...`);
      } else if (error.status === 400) {
        console.error('🚫 Error 400: Problema con la request');
      } else if (error.status === 403) {
        console.error('🚫 Error 403: API key inválida o sin permisos');
        return this.generarRespuestaFallback(); // No probar más modelos si la API key es inválida
      } else if (error.status === 429) {
        console.error('🚫 Error 429: Límite de cuota excedido');
        return this.generarRespuestaFallback(); // No probar más modelos si se excedió la cuota
      }
      
      // Probar siguiente modelo
      return this.probarModelosGemini(imagenBase64, mimeType, modelos, indice + 1);
    }
  }

  /**
   * Crea el prompt optimizado para análisis de productos e-commerce con Gemini 2.0/2.5.
   */
  private crearPromptAnalisisProducto(): string {
    return `
Analiza esta imagen de producto y responde SOLO con este JSON:

{
  "nombre": "Nombre específico del producto que ves",
  "categoria": "Electrónicos|Ropa|Hogar|Deportes|Libros|Juguetes|Belleza|Automotriz",
  "descripcion": "Descripción detallada basada en lo que observas",
  "precio": precio_pesos_argentinos_2025,
  "caracteristicas": ["característica 1", "característica 2", "característica 3"],
  "especificaciones": {
    "color": "color que ves",
    "material": "material aparente",
    "tamaño": "tamaño estimado",
    "estado": "condición visual",
    "marca": "marca visible o 'No visible'"
  },
  "palabras_clave": ["palabra1", "palabra2", "palabra3"],
  "confianza": nivel_0_a_1,
  "observaciones": "lo que específicamente observas en la imagen"
}

CATEGORÍAS:
- Contenedores/recipientes/baldes → Hogar
- Herramientas/equipos → Automotriz o Hogar
- Dispositivos/gadgets → Electrónicos
- Ropa/calzado → Ropa
- Deportes/fitness → Deportes
- Cosméticos → Belleza
- Libros/revistas → Libros
- Juguetes/juegos → Juguetes

PRECIOS ARGENTINA 2025:
Hogar: $5,000-$500,000 | Electrónicos: $20,000-$800,000 | Ropa: $8,000-$150,000

Describe exactamente lo que VES en la imagen. Solo JSON, sin texto adicional.
    `;
  }

  /**
   * Procesa la respuesta de Gemini y extrae los datos estructurados.
   */
  private procesarRespuestaGemini(response: any): ResultadoAnalisisGemini {
    try {
      console.log('🔍 Procesando respuesta de Gemini:', response);
      
      // Verificar estructura de respuesta más robusta
      if (!response) {
        console.error('❌ Respuesta de Gemini es null o undefined');
        throw new Error('Respuesta de Gemini vacía');
      }
      
      if (!response.candidates || !Array.isArray(response.candidates) || response.candidates.length === 0) {
        console.error('❌ Respuesta de Gemini sin candidates válidos:', response);
        throw new Error('No hay candidates en la respuesta');
      }
      
      const candidate = response.candidates[0];
      if (!candidate || !candidate.content) {
        console.error('❌ Candidate sin content:', candidate);
        throw new Error('Candidate sin content');
      }
      
      // Verificar si la respuesta se cortó por límite de tokens
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Respuesta cortada por límite de tokens, pero intentando procesar...');
      }
      
      if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        console.error('❌ Candidate sin parts válidas:', candidate.content);
        throw new Error('Candidate sin parts válidas');
      }
      
      const contenido = candidate.content.parts[0].text;
      console.log('📝 Contenido recibido:', contenido);
      
      // Limpiar la respuesta para extraer solo el JSON
      let jsonText = contenido.trim();
      
      // Si empieza con ```json, remover el markdown
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      
      // Buscar el JSON en el texto
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No se encontró JSON válido en la respuesta:', contenido);
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      let jsonString = jsonMatch[0];
      console.log('🔧 JSON extraído:', jsonString);
      
      // Si la respuesta se cortó, intentar completar el JSON básico
      if (candidate.finishReason === 'MAX_TOKENS' && !jsonString.endsWith('}')) {
        console.warn('⚠️ Intentando completar JSON cortado...');
        // Contar llaves abiertas vs cerradas
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        // Agregar llaves faltantes
        for (let i = 0; i < missingBraces; i++) {
          jsonString += '}';
        }
        
        console.log('🔧 JSON completado:', jsonString);
      }
      
      const datos = JSON.parse(jsonString);
      
      // Validar y normalizar los datos
      return {
        nombre: this.validarTexto(datos.nombre, 'Producto Detectado'),
        categoria: this.validarCategoria(datos.categoria),
        descripcion: this.validarTexto(datos.descripcion, 'Producto de calidad detectado por IA'),
        precio: this.validarPrecio(datos.precio),
        caracteristicas: Array.isArray(datos.caracteristicas) ? datos.caracteristicas.slice(0, 5) : [] as string[],
        especificaciones: datos.especificaciones ? {
          color: this.validarTexto(datos.especificaciones.color, ''),
          material: this.validarTexto(datos.especificaciones.material, ''),
          tamaño: this.validarTexto(datos.especificaciones.tamaño, ''),
          estado: this.validarTexto(datos.especificaciones.estado, ''),
          marca: this.validarTexto(datos.especificaciones.marca, '')
        } : undefined,
        palabras_clave: Array.isArray(datos.palabras_clave) ? datos.palabras_clave.slice(0, 5) : [],
        confianza: this.validarConfianza(datos.confianza),
        observaciones: this.validarTexto(datos.observaciones, '')
      };
    } catch (error) {
      console.error('Error procesando respuesta de Gemini:', error);
      return this.generarRespuestaFallback();
    }
  }

  /**
   * Valida y limpia texto recibido de Gemini.
   */
  private validarTexto(texto: string, fallback: string): string {
    if (!texto || typeof texto !== 'string') {
      return fallback;
    }
    return texto.trim().slice(0, 400); // Aumentado para descripciones más largas
  }

  /**
   * Valida que la categoría sea una de las permitidas.
   */
  private validarCategoria(categoria: string): string {
    const categoriasValidas = [
      'Electrónicos', 'Ropa', 'Hogar', 'Deportes', 
      'Libros', 'Juguetes', 'Belleza', 'Automotriz'
    ];
    
    if (categoriasValidas.includes(categoria)) {
      return categoria;
    }
    
    // Intentar mapear categorías similares
    const mapeosCategorias: { [key: string]: string } = {
      'electronics': 'Electrónicos',
      'technology': 'Electrónicos',
      'clothing': 'Ropa',
      'fashion': 'Ropa',
      'home': 'Hogar',
      'house': 'Hogar',
      'sports': 'Deportes',
      'fitness': 'Deportes',
      'books': 'Libros',
      'toys': 'Juguetes',
      'beauty': 'Belleza',
      'cosmetics': 'Belleza',
      'automotive': 'Automotriz',
      'car': 'Automotriz'
    };
    
    const categoriaLower = categoria.toLowerCase();
    for (const [key, value] of Object.entries(mapeosCategorias)) {
      if (categoriaLower.includes(key)) {
        return value;
      }
    }
    
    return 'Electrónicos'; // Categoría por defecto
  }

  /**
   * Valida y ajusta el precio sugerido.
   */
  private validarPrecio(precio: any): number {
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return 25000; // Precio por defecto
    }
    
    // Ajustar a rangos realistas
    if (precioNum < 1000) return precioNum * 1000; // Convertir si está en miles
    if (precioNum > 1000000) return 500000; // Máximo razonable
    
    return Math.round(precioNum);
  }

  /**
   * Valida el nivel de confianza del análisis.
   */
  private validarConfianza(confianza: any): number {
    const confianzaNum = Number(confianza);
    if (isNaN(confianzaNum) || confianzaNum < 0 || confianzaNum > 1) {
      return 0.8; // Confianza por defecto
    }
    return confianzaNum;
  }

  /**
   * Genera una respuesta de fallback cuando Gemini no está disponible.
   */
  private generarRespuestaFallback(): ResultadoAnalisisGemini {
    console.warn('⚠️ Usando respuesta de fallback - Gemini no disponible');
    return {
      nombre: 'Producto Detectado por IA',
      categoria: 'Hogar',
      descripcion: 'Producto de calidad detectado automáticamente. Por favor, revisa y ajusta los detalles según corresponda para una publicación óptima.',
      precio: 25000,
      caracteristicas: ['Calidad premium', 'Diseño funcional', 'Uso doméstico', 'Resistente', 'Práctico'],
      especificaciones: {
        color: 'No identificado',
        material: 'No identificado',
        tamaño: 'Mediano',
        estado: 'Nuevo',
        marca: 'No identificada'
      },
      palabras_clave: ['producto', 'hogar', 'calidad', 'funcional', 'práctico'],
      confianza: 0.3,
      observaciones: '⚠️ MODO SIMULACIÓN: Gemini AI no pudo analizar la imagen. Revisa la configuración de la API key y la conexión a internet.'
    };
  }

  /**
   * Verifica si la API de Gemini está configurada correctamente.
   */
  esApiConfigurada(): boolean {
    return this.API_KEY && this.API_KEY.length > 30 && this.API_KEY.startsWith('AIza');
  }

  /**
   * Obtiene información sobre el estado de la configuración.
   */
  obtenerEstadoConfiguracion(): { configurada: boolean; mensaje: string } {
    if (!this.esApiConfigurada()) {
      return {
        configurada: false,
        mensaje: 'API Key de Gemini no configurada. Usando modo simulación.'
      };
    }
    
    return {
      configurada: true,
      mensaje: 'Gemini AI configurado correctamente.'
    };
  }

  /**
   * Lista los modelos disponibles de Gemini AI.
   */
  async listarModelosDisponibles(): Promise<string[]> {
    try {
      // Intentar con diferentes versiones de la API
      const urls = [
        `https://generativelanguage.googleapis.com/v1/models?key=${this.API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.API_KEY}`
      ];
      
      for (const url of urls) {
        try {
          console.log('📋 Obteniendo lista de modelos desde:', url);
          const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
          const response = await this.http.get<any>(url, { headers }).toPromise();
          
          if (response && response.models) {
            const modelos = response.models
              .map((model: any) => model.name.replace('models/', ''))
              .filter((name: string) => name.includes('gemini'));
            
            console.log('✅ Modelos disponibles:', modelos);
            return modelos;
          }
        } catch (error) {
          console.log(`⚠️ Error con URL ${url}:`, error);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo modelos:', error);
      return [];
    }
  }

  /**
   * Prueba un modelo específico con un prompt simple.
   */
  async probarModeloSimple(modelo: string): Promise<boolean> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelo}:generateContent?key=${this.API_KEY}`;
      const requestBody = {
        contents: [{ parts: [{ text: 'Responde solo: "OK"' }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
      };
      
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      const response = await this.http.post<any>(url, requestBody, { headers }).toPromise();
      
      console.log(`✅ Modelo ${modelo} funciona:`, response);
      return true;
    } catch (error) {
      console.log(`❌ Modelo ${modelo} no funciona:`, error);
      return false;
    }
  }

  /**
   * Prueba la conexión con Gemini AI probando diferentes modelos.
   */
  async probarConexion(): Promise<boolean> {
    const modelosDisponibles = [
      // Modelos Gemini 2.5 (más recientes y potentes)
      'gemini-2.5-flash-exp',
      'gemini-2.5-pro-exp',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      
      // Modelos Gemini 2.0 (muy avanzados)
      'gemini-2.0-flash-exp',
      'gemini-2.0-pro-exp', 
      'gemini-2.0-flash',
      'gemini-2.0-pro',
      
      // Modelos Gemini 1.5 (estables como fallback)
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest', 
      'gemini-1.5-flash',
      'gemini-pro-vision',
      'gemini-pro'
    ];

    console.log('🧪 Probando conexión con Gemini AI...');
    
    for (let i = 0; i < modelosDisponibles.length; i++) {
      const modelo = modelosDisponibles[i];
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelo}:generateContent?key=${this.API_KEY}`;
      
      try {
        console.log(`🔍 Probando modelo ${i + 1}/${modelosDisponibles.length}: ${modelo}`);
        
        const testPrompt = 'Responde solo con: {"test": "ok", "modelo": "' + modelo + '"}';
        const requestBody = {
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
        };

        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const response = await this.http.post<any>(url, requestBody, { headers }).toPromise();
        
        console.log(`✅ ¡Conexión exitosa con ${modelo}!`, response);
        console.log(`🎯 Modelo funcional encontrado: ${modelo}`);
        return true;
        
      } catch (error: any) {
        console.error(`❌ Error con modelo ${modelo}:`, error.status, error.message);
        
        if (error.status === 403) {
          console.error('🚫 API Key inválida - no probar más modelos');
          return false;
        }
        
        if (i === modelosDisponibles.length - 1) {
          console.error('🚫 Todos los modelos fallaron');
          return false;
        }
      }
    }
    
    return false;
  }

  // --- MÉTODOS PARA GENERACIÓN DE CONTENIDO ---

  /**
   * Genera contenido completo para novedades usando Gemini AI
   */
  async generarContenidoNovedad(ideaUsuario: string): Promise<ResultadoGeneracionContenido | null> {
    console.log('🤖 Iniciando generación de contenido para:', ideaUsuario);
    
    if (!this.esApiConfigurada()) {
      throw new Error('API de Gemini no configurada');
    }

    try {
      const prompt = `
Eres un experto en marketing digital y e-commerce. Genera contenido para una novedad/oferta basada en esta idea: "${ideaUsuario}"

Responde SOLO con este JSON válido:
{
  "titulo": "Título atractivo y llamativo para la novedad (máximo 60 caracteres)",
  "descripcion": "Descripción corta y persuasiva que genere interés (máximo 120 caracteres)",
  "enlaceUrl": "URL sugerida para el enlace (ej: /productos/categoria-especifica)",
  "promptImagen": "Descripción detallada para generar una imagen promocional atractiva"
}

INSTRUCCIONES:
- El título debe ser impactante y generar curiosidad
- La descripción debe ser persuasiva y crear urgencia
- El enlace debe ser relevante al contenido
- El prompt de imagen debe describir una imagen promocional atractiva y profesional
- Usa técnicas de marketing como descuentos, ofertas limitadas, etc.
- Adapta el tono al público de e-commerce argentino

Responde EXCLUSIVAMENTE con el JSON, sin texto adicional.
      `;

      const response = await this.llamarGeminiAPI(prompt);
      
      if (response) {
        try {
          // Limpiar la respuesta de posibles caracteres extra
          const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const contenido = JSON.parse(cleanResponse);
          return contenido as ResultadoGeneracionContenido;
        } catch (parseError) {
          console.error('Error parseando respuesta JSON:', parseError);
          console.error('Respuesta recibida:', response);
          throw new Error('Error parseando respuesta de IA');
        }
      }
      
      throw new Error('No se recibió respuesta de la API');
      
    } catch (error) {
      console.error('Error generando contenido:', error);
      throw error;
    }
  }

  /**
   * Genera una imagen promocional profesional usando Canvas API
   */
  async generarImagenPromocion(prompt: string): Promise<ImagenGenerada | null> {
    console.log('🚀 Generando banner promocional para:', prompt);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo crear contexto de canvas');
      }

      // Configurar dimensiones de alta resolución
      canvas.width = 1920;
      canvas.height = 1080;
      
      // Configurar para alta calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Analizar el prompt para determinar el estilo
      const estiloInfo = this.analizarPromptParaEstilo(prompt);
      
      // Crear fondo con gradiente avanzado
      this.crearFondoAvanzado(ctx, canvas, estiloInfo);
      
      // Agregar elementos decorativos
      this.agregarElementosDecorativos(ctx, canvas, estiloInfo);
      
      // Agregar texto principal con efectos
      this.agregarTextoConEfectos(ctx, canvas, estiloInfo);
      
      // Agregar elementos gráficos adicionales
      this.agregarElementosGraficos(ctx, canvas, estiloInfo);
      
      // Aplicar filtros finales para mejorar calidad
      this.aplicarFiltrosFinales(ctx, canvas);
      
      // Convertir a blob con máxima calidad
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const imagenGenerada: ImagenGenerada = {
              url: url,
              nombre: `banner_hd_${Date.now()}.png`,
              tamaño: blob.size,
              tipo: blob.type
            };
            console.log('🎉 Banner HD generado exitosamente:', imagenGenerada);
            console.log('📊 Resolución:', canvas.width, 'x', canvas.height);
            console.log('💾 Tamaño:', (blob.size / 1024).toFixed(1), 'KB');
            resolve(imagenGenerada);
          } else {
            resolve(null);
          }
        }, 'image/png', 1.0); // Máxima calidad
      });

    } catch (error) {
      console.error('Error generando banner:', error);
      return null;
    }
  }

  /**
   * Analiza el prompt para determinar el estilo del banner
   */
  private analizarPromptParaEstilo(prompt: string) {
    const texto = prompt.toLowerCase();
    
    // Detectar porcentajes
    const porcentajeMatch = texto.match(/(\d+)%/);
    const porcentaje = porcentajeMatch ? porcentajeMatch[1] + '%' : '';
    
    // Determinar tipo de promoción
    let tipo = 'promocion';
    let colores = { primary: '#667eea', secondary: '#764ba2', accent: '#ffffff' };
    let textosPrincipales = ['PROMOCIÓN', 'ESPECIAL'];
    
    if (texto.includes('black friday') || texto.includes('cyber')) {
      tipo = 'blackfriday';
      colores = { primary: '#000000', secondary: '#333333', accent: '#FFD700' };
      textosPrincipales = ['BLACK', 'FRIDAY'];
    } else if (texto.includes('descuento') || texto.includes('oferta') || porcentaje) {
      tipo = 'descuento';
      colores = { primary: '#FF6B6B', secondary: '#FF8E53', accent: '#FFFFFF' };
      textosPrincipales = [porcentaje || 'GRAN', 'DESCUENTO'];
    } else if (texto.includes('nuevo') || texto.includes('lanzamiento')) {
      tipo = 'nuevo';
      colores = { primary: '#4ECDC4', secondary: '#44A08D', accent: '#FFFFFF' };
      textosPrincipales = ['NUEVO', 'LANZAMIENTO'];
    } else if (texto.includes('navidad') || texto.includes('fiestas')) {
      tipo = 'navidad';
      colores = { primary: '#C41E3A', secondary: '#228B22', accent: '#FFD700' };
      textosPrincipales = ['OFERTAS', 'NAVIDEÑAS'];
    }
    
    return {
      tipo,
      colores,
      textosPrincipales,
      porcentaje,
      subtexto: this.generarSubtexto(tipo)
    };
  }

  /**
   * Crea un fondo avanzado con gradientes y efectos de alta calidad
   */
  private crearFondoAvanzado(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, estilo: any) {
    // Gradiente principal con múltiples capas
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, estilo.colores.primary);
    gradient.addColorStop(0.3, this.mezclarColores(estilo.colores.primary, estilo.colores.secondary, 0.7));
    gradient.addColorStop(0.6, estilo.colores.secondary);
    gradient.addColorStop(0.8, this.mezclarColores(estilo.colores.secondary, estilo.colores.primary, 0.6));
    gradient.addColorStop(1, estilo.colores.primary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gradiente radial superpuesto para profundidad
    const radialGradient = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.5, 0,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
    );
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    radialGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Patrones específicos de alta calidad
    if (estilo.tipo === 'blackfriday') {
      this.crearPatronBlackFriday(ctx, canvas);
    } else if (estilo.tipo === 'navidad') {
      this.crearPatronNavidad(ctx, canvas);
    } else if (estilo.tipo === 'descuento') {
      this.crearPatronDescuento(ctx, canvas);
    }
    
    // Efectos de luz múltiples
    this.agregarEfectosLuz(ctx, canvas, estilo);
    
    // Textura sutil
    this.agregarTextura(ctx, canvas);
  }

  /**
   * Mezcla dos colores hexadecimales
   */
  private mezclarColores(color1: string, color2: string, ratio: number): string {
    const hex = (color: string) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 255;
    const g1 = (hex(color1) >> 8) & 255;
    const b1 = hex(color1) & 255;
    const r2 = (hex(color2) >> 16) & 255;
    const g2 = (hex(color2) >> 8) & 255;
    const b2 = hex(color2) & 255;
    
    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Crea patrón específico para Black Friday
   */
  private crearPatronBlackFriday(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Patrón de hexágonos dorados
    ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
    const size = 60;
    for (let x = 0; x < canvas.width + size; x += size * 1.5) {
      for (let y = 0; y < canvas.height + size; y += size * Math.sqrt(3)) {
        const offsetX = (y / (size * Math.sqrt(3))) % 2 === 1 ? size * 0.75 : 0;
        this.dibujarHexagono(ctx, x + offsetX, y, size * 0.3);
      }
    }
  }

  /**
   * Crea patrón específico para Navidad
   */
  private crearPatronNavidad(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Copos de nieve de diferentes tamaños
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const tamaño = Math.random() * 20 + 10;
      const opacidad = Math.random() * 0.3 + 0.1;
      this.dibujarCopoAvanzado(ctx, x, y, tamaño, opacidad);
    }
  }

  /**
   * Crea patrón específico para descuentos
   */
  private crearPatronDescuento(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Rayos de energía
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    const centerX = canvas.width * 0.8;
    const centerY = canvas.height * 0.2;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const length = 200 + Math.random() * 100;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * length,
        centerY + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }

  /**
   * Agrega múltiples efectos de luz
   */
  private agregarEfectosLuz(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, estilo: any) {
    // Luz principal
    const lightGradient1 = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.3, 0,
      canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.6
    );
    lightGradient1.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    lightGradient1.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    lightGradient1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = lightGradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Luz secundaria
    const lightGradient2 = ctx.createRadialGradient(
      canvas.width * 0.2, canvas.height * 0.8, 0,
      canvas.width * 0.2, canvas.height * 0.8, canvas.width * 0.4
    );
    lightGradient2.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    lightGradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = lightGradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Agrega textura sutil al fondo
   */
  private agregarTextura(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Ruido sutil para textura
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 10 - 5;
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = Math.abs(noise); // A
    }
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.03;
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * Agrega elementos decorativos al banner
   */
  private agregarElementosDecorativos(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, estilo: any) {
    // Formas geométricas decorativas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    // Círculos decorativos
    ctx.beginPath();
    ctx.arc(canvas.width * 0.1, canvas.height * 0.2, 80, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width * 0.9, canvas.height * 0.8, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Líneas decorativas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.7);
    ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.5, canvas.width, canvas.height * 0.8);
    ctx.stroke();
    
    // Elementos específicos por tipo
    if (estilo.tipo === 'descuento' && estilo.porcentaje) {
      this.dibujarEtiquetaDescuento(ctx, canvas, estilo.porcentaje);
    }
  }

  /**
   * Agrega texto con efectos avanzados de alta calidad
   */
  private agregarTextoConEfectos(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, estilo: any) {
    const texto1 = estilo.textosPrincipales[0];
    const texto2 = estilo.textosPrincipales[1];
    
    // Texto principal con múltiples efectos
    this.dibujarTextoConEfectos3D(ctx, texto1, canvas.width / 2, canvas.height / 2 - 80, 120, estilo);
    this.dibujarTextoConEfectos3D(ctx, texto2, canvas.width / 2, canvas.height / 2 + 40, 120, estilo);
    
    // Subtexto con glow
    this.dibujarTextoConGlow(ctx, estilo.subtexto, canvas.width / 2, canvas.height / 2 + 160, 42, 'rgba(255, 255, 255, 0.95)');
    
    // Texto adicional si hay porcentaje
    if (estilo.porcentaje && estilo.tipo === 'descuento') {
      this.dibujarTextoConEfectos3D(ctx, estilo.porcentaje, canvas.width * 0.85, canvas.height * 0.25, 80, {
        colores: { accent: '#FFD700' }
      });
    }
  }

  /**
   * Dibuja texto con efectos 3D
   */
  private dibujarTextoConEfectos3D(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, tamaño: number, estilo: any) {
    const font = `bold ${tamaño}px 'Arial Black', Arial, sans-serif`;
    
    // Sombra profunda (múltiples capas)
    for (let i = 8; i > 0; i--) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * (9 - i)})`;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texto, x + i, y + i);
    }
    
    // Borde oscuro
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 6;
    ctx.font = font;
    ctx.strokeText(texto, x, y);
    
    // Borde medio
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeText(texto, x, y);
    
    // Texto principal con gradiente
    const gradient = ctx.createLinearGradient(x, y - tamaño/2, x, y + tamaño/2);
    gradient.addColorStop(0, estilo.colores.accent);
    gradient.addColorStop(0.5, this.ajustarBrillo(estilo.colores.accent, 1.2));
    gradient.addColorStop(1, this.ajustarBrillo(estilo.colores.accent, 0.8));
    
    ctx.fillStyle = gradient;
    ctx.fillText(texto, x, y);
    
    // Highlight superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText(texto, x, y - 2);
  }

  /**
   * Dibuja texto con efecto glow
   */
  private dibujarTextoConGlow(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, tamaño: number, color: string) {
    const font = `bold ${tamaño}px Arial, sans-serif`;
    
    // Glow exterior
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(texto, x, y);
    
    // Glow interior
    ctx.shadowBlur = 10;
    ctx.fillText(texto, x, y);
    
    // Texto final
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillText(texto, x, y);
  }

  /**
   * Ajusta el brillo de un color
   */
  private ajustarBrillo(color: string, factor: number): string {
    const hex = parseInt(color.slice(1), 16);
    const r = Math.min(255, Math.max(0, Math.round(((hex >> 16) & 255) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(((hex >> 8) & 255) * factor)));
    const b = Math.min(255, Math.max(0, Math.round((hex & 255) * factor)));
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Dibuja un hexágono
   */
  private dibujarHexagono(ctx: CanvasRenderingContext2D, x: number, y: number, radio: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const px = x + Math.cos(angle) * radio;
      const py = y + Math.sin(angle) * radio;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Dibuja un copo de nieve avanzado
   */
  private dibujarCopoAvanzado(ctx: CanvasRenderingContext2D, x: number, y: number, tamaño: number, opacidad: number) {
    ctx.save();
    ctx.globalAlpha = opacidad;
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacidad})`;
    ctx.lineWidth = 2;
    
    // Copo principal
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(i * Math.PI / 3);
      
      // Línea principal
      ctx.beginPath();
      ctx.moveTo(0, -tamaño);
      ctx.lineTo(0, tamaño);
      ctx.stroke();
      
      // Ramas
      for (let j = 0.3; j <= 0.7; j += 0.4) {
        const branchY = tamaño * j;
        const branchSize = tamaño * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(-branchSize, -branchY);
        ctx.lineTo(0, -branchY + branchSize);
        ctx.lineTo(branchSize, -branchY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-branchSize, branchY);
        ctx.lineTo(0, branchY - branchSize);
        ctx.lineTo(branchSize, branchY);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  /**
   * Agrega elementos gráficos adicionales
   */
  private agregarElementosGraficos(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, estilo: any) {
    // Marco decorativo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 10]);
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.setLineDash([]);
    
    // Elementos específicos
    if (estilo.tipo === 'nuevo') {
      this.dibujarEstrella(ctx, canvas.width * 0.15, canvas.height * 0.15, 30, estilo.colores.accent);
      this.dibujarEstrella(ctx, canvas.width * 0.85, canvas.height * 0.85, 25, estilo.colores.accent);
    }
    
    // Indicador de urgencia
    if (estilo.tipo === 'descuento' || estilo.tipo === 'blackfriday') {
      this.dibujarIndicadorUrgencia(ctx, canvas);
    }
  }

  /**
   * Dibuja una etiqueta de descuento
   */
  private dibujarEtiquetaDescuento(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, porcentaje: string) {
    const x = canvas.width * 0.85;
    const y = canvas.height * 0.2;
    const radio = 60;
    
    // Círculo de fondo
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fill();
    
    // Borde
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Texto del porcentaje
    ctx.fillStyle = '#FF4500';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(porcentaje, x, y - 5);
    ctx.font = 'bold 16px Arial';
    ctx.fillText('OFF', x, y + 15);
  }

  /**
   * Dibuja una estrella decorativa
   */
  private dibujarEstrella(ctx: CanvasRenderingContext2D, x: number, y: number, radio: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const px = x + Math.cos(angle) * radio;
      const py = y + Math.sin(angle) * radio;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Dibuja un copo de nieve
   */
  private dibujarCopo(ctx: CanvasRenderingContext2D, x: number, y: number, tamaño: number) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(i * Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, -tamaño);
      ctx.lineTo(0, tamaño);
      ctx.moveTo(-tamaño/2, -tamaño/2);
      ctx.lineTo(tamaño/2, tamaño/2);
      ctx.moveTo(tamaño/2, -tamaño/2);
      ctx.lineTo(-tamaño/2, tamaño/2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Dibuja indicador de urgencia
   */
  private dibujarIndicadorUrgencia(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const x = canvas.width * 0.1;
    const y = canvas.height * 0.85;
    
    // Fondo del indicador
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(x - 80, y - 15, 160, 30);
    
    // Texto de urgencia
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡TIEMPO LIMITADO!', x, y + 5);
  }

  /**
   * Genera subtexto apropiado según el tipo
   */
  private generarSubtexto(tipo: string): string {
    const subtextos: { [key: string]: string } = {
      'descuento': '¡Aprovecha esta increíble oferta!',
      'nuevo': 'Descubre lo último en nuestra tienda',
      'blackfriday': '¡Los mejores precios del año!',
      'navidad': 'Regalos perfectos para estas fiestas',
      'promocion': '¡No te lo pierdas!'
    };
    
    return subtextos[tipo] || subtextos['promocion'];
  }

  /**
   * Aplica filtros finales para mejorar la calidad del banner
   */
  private aplicarFiltrosFinales(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Aplicar sharpening sutil
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Crear copia para el filtro
    const originalData = new Uint8ClampedArray(data);
    
    // Kernel de sharpening
    const kernel = [
      0, -0.25, 0,
      -0.25, 2, -0.25,
      0, -0.25, 0
    ];
    
    // Aplicar filtro de sharpening muy sutil
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB, no alpha
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += originalData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    // Aplicar el filtro con intensidad muy baja
    ctx.globalAlpha = 0.3;
    ctx.putImageData(imageData, 0, 0);
    ctx.globalAlpha = 1;
    
    // Aplicar un ligero contraste
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }


  /**
   * Método de prueba para generar imagen simple
   */
  async generarImagenPrueba(): Promise<string> {
    console.log('🧪 Generando imagen de prueba...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 400;
    
    // Fondo simple
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto simple
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRUEBA IA', canvas.width / 2, canvas.height / 2);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          console.log('🎉 Imagen de prueba generada:', url);
          resolve(url);
        } else {
          resolve('');
        }
      }, 'image/png');
    });
  }

  /**
   * Llama a la API de Gemini con un prompt
   */
  private async llamarGeminiAPI(prompt: string): Promise<string | null> {
    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };

      const url = `${this.GEMINI_API_URL}?key=${this.API_KEY}`;
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      
      const response = await this.http.post<any>(url, requestBody, { headers }).toPromise();
      
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text.trim();
      }
      
      return null;
      
    } catch (error) {
      console.error('Error llamando a Gemini API:', error);
      return null;
    }
  }
}
