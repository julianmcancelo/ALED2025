import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURACIÓN DE SUPABASE PARA ALED2025
 * =======================================
 * 
 * Configuración centralizada para la conexión con Supabase
 * Incluye cliente configurado y tipos de datos
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

// 🔑 CONFIGURACIÓN DE CONEXIÓN
// Credenciales del proyecto ALED2025 en Supabase
const supabaseUrl = 'https://gyhzptzltqrxvgmwmkzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHpwdHpsdHFyeHZnbXdta3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODAyOTgsImV4cCI6MjA3NTY1NjI5OH0.rSrOQ4NWvwEU0Ec2HJTNYtpV7vp_0limf5Naf4ow7LM';

// 📝 INSTRUCCIONES PARA CONFIGURAR:
// 1. Ve a https://supabase.com y crea un proyecto
// 2. En Settings > API, copia la URL y anon key
// 3. Reemplaza las variables de arriba
// 4. Ejecuta el script SQL de database/schema.sql

// 🌐 CLIENTE SUPABASE CONFIGURADO
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Deshabilitado para evitar NavigatorLockAcquireTimeoutError
    autoRefreshToken: false, // Deshabilitado ya que usamos autenticación personalizada
    detectSessionInUrl: false // Deshabilitado ya que no usamos auth URLs
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'aled2025-angular'
    }
  }
});

// 📊 TIPOS DE DATOS PARA TYPESCRIPT
export interface SupabaseProducto {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria_id: string | null; // Permitir null para evitar errores de BD
  stock?: number;
  imagen_url?: string;
  activo: boolean;
  es_destacado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseCategoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseUsuario {
  id?: string;
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  rol: 'admin' | 'usuario';
  password_hash?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  telefono?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  // Nota: acepta_novedades y acepta_terminos no existen en la tabla real de Supabase
}

// 🎯 CONFIGURACIÓN DE STORAGE
export const STORAGE_BUCKETS = {
  PRODUCTOS: 'productos-imagenes',
  AVATARES: 'avatares-usuarios'
} as const;

// 📝 CONFIGURACIÓN DE TABLAS
export const TABLES = {
  PRODUCTOS: 'productos',
  CATEGORIAS: 'categorias',
  USUARIOS: 'usuarios',
  PEDIDOS: 'pedidos',
  ITEMS_PEDIDO: 'items_pedido',
  NOVEDADES: 'novedades',
  CONFIGURACION: 'configuracion'
} as const;

console.log('🚀 Configuración de Supabase cargada para ALED2025');
