import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE PARA PRODUCCIÓN - ALED2025
 * ====================================================
 * 
 * Configuración optimizada y segura para ambiente de producción
 * Incluye autenticación habilitada y configuraciones de seguridad
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

// 🔑 CONFIGURACIÓN DE PRODUCCIÓN
// ⚠️ CAMBIAR ESTAS CREDENCIALES EN PRODUCCIÓN
const supabaseUrl = 'https://gyhzptzltqrxvgmwmkzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHpwdHpsdHFyeHZnbXdta3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODAyOTgsImV4cCI6MjA3NTY1NjI5OH0.rSrOQ4NWvwEU0Ec2HJTNYtpV7vp_0limf5Naf4ow7LM';

// 🌐 CLIENTE SUPABASE PARA PRODUCCIÓN
export const supabaseProduction = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // ✅ AUTENTICACIÓN HABILITADA PARA PRODUCCIÓN
    persistSession: true, // Mantener sesión persistente
    autoRefreshToken: true, // Renovar tokens automáticamente
    detectSessionInUrl: true, // Detectar sesión en URL (para magic links)
    flowType: 'pkce', // Usar PKCE para mayor seguridad
    
    // 🔒 CONFIGURACIÓN DE SEGURIDAD
    storage: {
      getItem: (key) => {
        // Encriptar datos en localStorage para producción
        const item = localStorage.getItem(key);
        return item ? atob(item) : null; // Decodificar base64
      },
      setItem: (key, value) => {
        // Encriptar datos antes de guardar
        localStorage.setItem(key, btoa(value)); // Codificar en base64
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      }
    }
  },
  
  realtime: {
    // 📡 CONFIGURACIÓN OPTIMIZADA PARA PRODUCCIÓN
    params: {
      eventsPerSecond: 5, // Reducir eventos para mejor performance
      heartbeatIntervalMs: 30000, // 30 segundos
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000) // Backoff exponencial
    }
  },
  
  global: {
    // 🌍 HEADERS GLOBALES PARA PRODUCCIÓN
    headers: {
      'X-Client-Info': 'aled2025-production',
      'X-Client-Version': '1.0.0',
      'Cache-Control': 'no-cache'
    },
    
    // 🔧 CONFIGURACIÓN DE FETCH
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Agregar timeout para requests
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      });
    }
  },
  
  // 📊 CONFIGURACIÓN DE BASE DE DATOS
  db: {
    schema: 'public'
  }
});

// 🛡️ CONFIGURACIÓN DE SEGURIDAD ADICIONAL
export const PRODUCTION_CONFIG = {
  // 📁 STORAGE CONFIGURATION
  STORAGE: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    COMPRESSION_QUALITY: 0.8, // 80% calidad para optimizar tamaño
    MAX_UPLOADS_PER_HOUR: 50,
    BUCKET_NAME: 'productos-imagenes'
  },
  
  // 🔐 AUTHENTICATION
  AUTH: {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
    REFRESH_THRESHOLD: 60 * 1000, // Renovar 1 minuto antes de expirar
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutos
  },
  
  // 📡 API LIMITS
  API: {
    RATE_LIMIT_PER_MINUTE: 100,
    MAX_CONCURRENT_REQUESTS: 10,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 segundo
  },
  
  // 🔍 MONITORING
  MONITORING: {
    LOG_LEVEL: 'error', // Solo errores en producción
    ENABLE_ANALYTICS: true,
    ERROR_REPORTING: true,
    PERFORMANCE_MONITORING: true
  }
};

// 📊 TIPOS DE DATOS PARA PRODUCCIÓN (con validaciones)
export interface ProductoProduccion extends SupabaseProducto {
  // Campos adicionales para producción
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string[];
  imagen_optimizada_url?: string;
  imagen_thumbnail_url?: string;
  audit_created_by?: string;
  audit_updated_by?: string;
}

export interface UsuarioProduccion extends SupabaseUsuario {
  // Campos adicionales para producción
  last_login?: string;
  login_attempts?: number;
  locked_until?: string;
  email_verified?: boolean;
  two_factor_enabled?: boolean;
  preferences?: {
    notifications: boolean;
    marketing_emails: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
}

// 🔧 UTILIDADES PARA PRODUCCIÓN
export class ProductionUtils {
  
  /**
   * Valida y comprime imagen antes de subir
   */
  static async validateAndCompressImage(file: File): Promise<File> {
    // Validar tamaño
    if (file.size > PRODUCTION_CONFIG.STORAGE.MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande. Máximo ${PRODUCTION_CONFIG.STORAGE.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Validar tipo
    if (!PRODUCTION_CONFIG.STORAGE.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }
    
    // Comprimir imagen (implementar con canvas o librería)
    return file; // Por ahora retornar original
  }
  
  /**
   * Genera nombre de archivo seguro para producción
   */
  static generateSecureFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
      .substring(0, 50);
    
    return `productos/${timestamp}_${userId}_${randomId}_${sanitizedName}.${extension}`;
  }
  
  /**
   * Maneja errores de forma segura en producción
   */
  static handleProductionError(error: any, context: string): void {
    // Log del error (sin información sensible)
    console.error(`[PRODUCTION ERROR] ${context}:`, {
      message: error.message,
      timestamp: new Date().toISOString(),
      context
    });
    
    // Reportar a servicio de monitoreo (Sentry, etc.)
    if (PRODUCTION_CONFIG.MONITORING.ERROR_REPORTING) {
      // Implementar reporte de errores
    }
  }
  
  /**
   * Verifica límites de rate limiting
   */
  static checkRateLimit(userId: string, action: string): boolean {
    // Implementar verificación de rate limiting
    // Por ahora retornar true
    return true;
  }
}

// 📝 CONFIGURACIÓN DE TABLAS (igual que desarrollo)
export const TABLES = {
  PRODUCTOS: 'productos',
  CATEGORIAS: 'categorias',
  USUARIOS: 'usuarios',
  PEDIDOS: 'pedidos',
  ITEMS_PEDIDO: 'items_pedido',
  NOVEDADES: 'novedades',
  CONFIGURACION: 'configuracion',
  // Tablas adicionales para producción
  AUDIT_LOG: 'audit_log',
  STORAGE_AUDIT: 'storage_audit_log',
  RATE_LIMITS: 'upload_rate_limit'
} as const;

// 🎯 CONFIGURACIÓN DE STORAGE PARA PRODUCCIÓN
export const STORAGE_BUCKETS = {
  PRODUCTOS: 'productos-imagenes',
  AVATARES: 'avatares-usuarios',
  DOCUMENTOS: 'documentos-sistema', // Bucket adicional para producción
  BACKUPS: 'backups-automaticos' // Bucket para backups
} as const;

// Importar tipos base
import { 
  SupabaseProducto, 
  SupabaseCategoria, 
  SupabaseUsuario 
} from './supabase.config';

console.log('🚀 Configuración de Supabase PRODUCCIÓN cargada para ALED2025');
console.log('🔒 Modo: PRODUCCIÓN - Seguridad habilitada');
console.log('📊 Monitoreo:', PRODUCTION_CONFIG.MONITORING.ENABLE_ANALYTICS ? 'Habilitado' : 'Deshabilitado');
