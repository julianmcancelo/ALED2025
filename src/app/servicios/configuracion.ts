import { Injectable, signal } from '@angular/core';
import { supabase, TABLES } from '../config/supabase.config';

/**
 * @interface ConfiguracionSitio
 * Define la estructura de los datos de configuración.
 * Esto nos ayuda a mantener la consistencia de los datos.
 */
export interface ConfiguracionSitio {
  titulo: string;
  subtitulo: string;
  // En el futuro, podríamos añadir más campos como:
  // logoUrl: string;
  // colorPrincipal: string;
}

/**
 * @class ConfiguracionService
 * Gestiona la configuración global del sitio almacenada en Supabase.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  // --- SEÑAL DE ESTADO (SIGNAL) ---
  /**
   * @signal configuracionSignal
   * Almacena la configuración actual del sitio.
   * Se inicializa con un valor por defecto mientras se cargan los datos.
   */
  configuracionSignal = signal<ConfiguracionSitio>({
    titulo: 'ALED2025 - E-commerce',
    subtitulo: 'Proyecto desarrollado con Angular y Supabase',
  });

  constructor() {
    console.log('⚙️ Inicializando ConfiguracionService con Supabase...');
    // --- LÓGICA DE ARRANQUE: CARGAR CONFIGURACIÓN ---
    this.cargarConfiguracion();
  }

  /**
   * Carga la configuración desde Supabase.
   * @private
   */
  private async cargarConfiguracion(): Promise<void> {
    try {
      console.log('📋 Cargando configuración desde Supabase...');
      
      // Intentar cargar configuración desde Supabase
      const { data, error } = await supabase
        .from(TABLES.CONFIGURACION)
        .select('*')
        .eq('clave', 'sitio')
        .single();

      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        // Error diferente a "no encontrado" o "tabla no existe"
        console.error('❌ Error al cargar configuración:', error);
        // No lanzar error, usar configuración por defecto
        console.log('⚠️ Usando configuración por defecto debido a error');
        return;
      }

      if (data) {
        // Si existe configuración, la usamos
        console.log('✅ Configuración cargada desde Supabase');
        this.configuracionSignal.set({
          titulo: data.titulo || 'ALED2025 - E-commerce',
          subtitulo: data.subtitulo || 'Proyecto desarrollado con Angular y Supabase'
        });
      } else {
        // Si no existe, crear configuración por defecto
        console.log('📝 Creando configuración por defecto...');
        await this.crearConfiguracionPorDefecto();
      }

    } catch (error: any) {
      console.error('❌ Error al cargar configuración:', error);
      // Mantener valores por defecto en caso de error
      this.configuracionSignal.set({
        titulo: 'ALED2025 - E-commerce',
        subtitulo: 'Proyecto desarrollado con Angular y Supabase'
      });
    }
  }

  /**
   * Crea la configuración por defecto en Supabase.
   * @private
   */
  private async crearConfiguracionPorDefecto(): Promise<void> {
    try {
      const configuracionDefecto = {
        clave: 'sitio',
        titulo: 'ALED2025 - E-commerce',
        subtitulo: 'Proyecto desarrollado con Angular y Supabase por Cancelo Julian & Nicolas Otero'
      };

      const { error } = await supabase
        .from(TABLES.CONFIGURACION)
        .insert(configuracionDefecto);

      if (error) {
        console.error('❌ Error al crear configuración por defecto:', error);
      } else {
        console.log('✅ Configuración por defecto creada');
        this.configuracionSignal.set({
          titulo: configuracionDefecto.titulo,
          subtitulo: configuracionDefecto.subtitulo
        });
      }
    } catch (error: any) {
      console.error('❌ Error al crear configuración por defecto:', error);
    }
  }

  /**
   * Actualiza la configuración en Supabase.
   * @param nuevosDatos - Un objeto parcial con los datos a actualizar.
   * @returns Una promesa que se resuelve cuando la operación de escritura finaliza.
   */
  async actualizarConfiguracion(nuevosDatos: Partial<ConfiguracionSitio>): Promise<void> {
    try {
      console.log('💾 Actualizando configuración en Supabase...');
      
      const { error } = await supabase
        .from(TABLES.CONFIGURACION)
        .update(nuevosDatos)
        .eq('clave', 'sitio');

      if (error) {
        console.error('❌ Error al actualizar configuración:', error);
        throw error;
      }

      console.log('✅ Configuración actualizada correctamente');
      
      // Actualizar la señal local
      const configuracionActual = this.configuracionSignal();
      this.configuracionSignal.set({
        ...configuracionActual,
        ...nuevosDatos
      });

    } catch (error: any) {
      console.error('❌ Error al actualizar configuración:', error);
      throw error;
    }
  }
}
