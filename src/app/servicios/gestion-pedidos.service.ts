import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase, TABLES } from '../config/supabase.config';

/**
 * ============================================================================
 * ENUMERACIONES Y INTERFACES PARA PEDIDOS
 * ============================================================================
 */

/**
 * Estados posibles de un pedido en el sistema
 */
export enum EstadoPedido {
  PENDIENTE = 'pendiente',           // Recién recibido, esperando confirmación
  CONFIRMADO = 'confirmado',         // Admin confirmó el pedido
  PREPARANDO = 'preparando',         // Preparando el envío/producto
  ENVIADO = 'enviado',              // Enviado al cliente
  ENTREGADO = 'entregado',          // Entregado exitosamente
  CANCELADO = 'cancelado'           // Cancelado por algún motivo
}

/**
 * Interfaz completa de un pedido en el sistema
 */
export interface Pedido {
  id: string;                       // ID único del pedido
  paymentId: string;                // ID del pago en Mercado Pago
  estado: EstadoPedido;             // Estado actual del pedido
  total: number;                    // Monto total del pedido
  fechaCreacion: string;            // Fecha de creación del pedido
  fechaActualizacion?: string;      // Fecha de última actualización
  numeroSeguimiento?: string;       // Número de seguimiento del envío
  notasAdmin?: string;              // Notas internas del administrador
  
  // Información del cliente
  clienteId: string;                // ID del cliente
  clienteNombre: string;            // Nombre del cliente
  clienteEmail: string;             // Email del cliente
  clienteTelefono?: string;         // Teléfono del cliente
  
  // Información de entrega
  direccionEntrega: string;         // Dirección de entrega
  ciudadEntrega: string;            // Ciudad de entrega
  codigoPostalEntrega?: string;     // Código postal
  
  // Productos del pedido
  productos: ProductoPedido[];      // Lista de productos en el pedido
}

/**
 * Interfaz para un producto dentro de un pedido
 */
export interface ProductoPedido {
  id: string;                       // ID del producto
  nombre: string;                   // Nombre del producto
  precio: number;                   // Precio unitario
  cantidad: number;                 // Cantidad solicitada
  subtotal: number;                 // Precio * cantidad
  imagen?: string;                  // URL de la imagen del producto
}

/**
 * ============================================================================
 * SERVICIO DE GESTIÓN DE PEDIDOS CON SUPABASE
 * ============================================================================
 * 
 * Este servicio maneja todas las operaciones relacionadas con pedidos:
 * - Obtener lista de pedidos
 * - Actualizar estados de pedidos
 * - Filtrar pedidos por diferentes criterios
 * - Gestionar notas y seguimiento
 */
@Injectable({
  providedIn: 'root'
})
export class GestionPedidosService {

  constructor() {
    console.log('🛒 Servicio de Gestión de Pedidos inicializado con Supabase');
  }

  /**
   * ============================================================================
   * MÉTODOS PARA OBTENER PEDIDOS
   * ============================================================================
   */

  /**
   * Obtiene todos los pedidos ordenados por fecha de creación (más recientes primero)
   * @returns Observable con la lista de todos los pedidos
   */
  obtenerTodosLosPedidos(): Observable<Pedido[]> {
    console.log('📋 Obteniendo todos los pedidos...');
    
    return from(supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .order('fechaCreacion', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener pedidos:', error);
          throw error;
        }
        console.log('✅ Pedidos obtenidos:', data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en obtenerTodosLosPedidos:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene pedidos filtrados por estado
   * @param estado - Estado del pedido a filtrar
   * @returns Observable con pedidos del estado especificado
   */
  obtenerPedidosPorEstado(estado: EstadoPedido): Observable<Pedido[]> {
    console.log(`🔍 Filtrando pedidos por estado: ${estado}`);
    
    return from(supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('estado', estado)
      .order('fechaCreacion', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al filtrar pedidos por estado:', error);
          throw error;
        }
        console.log(`✅ Pedidos filtrados por ${estado}:`, data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en obtenerPedidosPorEstado:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene pedidos de un cliente específico
   * @param clienteId - ID del cliente
   * @returns Observable con pedidos del cliente
   */
  obtenerPedidosDeCliente(clienteId: string): Observable<Pedido[]> {
    console.log(`👤 Obteniendo pedidos del cliente: ${clienteId}`);
    
    return from(supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .eq('clienteId', clienteId)
      .order('fechaCreacion', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener pedidos del cliente:', error);
          throw error;
        }
        console.log(`✅ Pedidos del cliente obtenidos:`, data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en obtenerPedidosDeCliente:', error);
        throw error;
      })
    );
  }

  /**
   * ============================================================================
   * MÉTODOS PARA ACTUALIZAR PEDIDOS
   * ============================================================================
   */

  /**
   * Actualiza el estado de un pedido
   * @param pedidoId - ID del pedido a actualizar
   * @param nuevoEstado - Nuevo estado del pedido
   * @returns Promise que se resuelve cuando la actualización se completa
   */
  async actualizarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido): Promise<void> {
    try {
      console.log(`📝 Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);
      
      const datosActualizacion: any = {
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString()
      };

      // Si el estado es ENTREGADO, también actualizamos la fecha de entrega
      if (nuevoEstado === EstadoPedido.ENTREGADO) {
        datosActualizacion.fechaEntrega = new Date().toISOString();
      }

      const { error } = await supabase
        .from(TABLES.PEDIDOS)
        .update(datosActualizacion)
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ Error al actualizar estado del pedido:', error);
        throw error;
      }

      console.log(`✅ Estado del pedido actualizado: ${pedidoId} -> ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error en actualizarEstadoPedido:', error);
      throw error;
    }
  }

  /**
   * Agrega número de seguimiento a un pedido
   * @param pedidoId - ID del pedido
   * @param numeroSeguimiento - Número de seguimiento del envío
   * @returns Promise que se resuelve cuando la actualización se completa
   */
  async agregarNumeroSeguimiento(pedidoId: string, numeroSeguimiento: string): Promise<void> {
    try {
      console.log(`📦 Agregando número de seguimiento al pedido ${pedidoId}: ${numeroSeguimiento}`);
      
      const { error } = await supabase
        .from(TABLES.PEDIDOS)
        .update({
          numeroSeguimiento: numeroSeguimiento,
          fechaActualizacion: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ Error al agregar número de seguimiento:', error);
        throw error;
      }

      console.log(`✅ Número de seguimiento agregado: ${pedidoId}`);
    } catch (error) {
      console.error('❌ Error en agregarNumeroSeguimiento:', error);
      throw error;
    }
  }

  /**
   * Actualiza las notas administrativas de un pedido
   * @param pedidoId - ID del pedido
   * @param notas - Notas administrativas
   * @returns Promise que se resuelve cuando la actualización se completa
   */
  async actualizarNotasPedido(pedidoId: string, notas: string): Promise<void> {
    try {
      console.log(`📝 Actualizando notas del pedido ${pedidoId}`);
      
      const { error } = await supabase
        .from(TABLES.PEDIDOS)
        .update({
          notasAdmin: notas,
          fechaActualizacion: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ Error al actualizar notas del pedido:', error);
        throw error;
      }

      console.log(`✅ Notas del pedido actualizadas: ${pedidoId}`);
    } catch (error) {
      console.error('❌ Error en actualizarNotasPedido:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODOS DE UTILIDAD Y ESTADÍSTICAS
   * ============================================================================
   */

  /**
   * Obtiene estadísticas básicas de pedidos
   * @returns Promise con estadísticas de pedidos
   */
  async obtenerEstadisticasPedidos(): Promise<{
    total: number;
    pendientes: number;
    confirmados: number;
    enviados: number;
    entregados: number;
    cancelados: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PEDIDOS)
        .select('estado');

      if (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
      }

      const estadisticas = {
        total: data?.length || 0,
        pendientes: data?.filter(p => p.estado === EstadoPedido.PENDIENTE).length || 0,
        confirmados: data?.filter(p => p.estado === EstadoPedido.CONFIRMADO).length || 0,
        enviados: data?.filter(p => p.estado === EstadoPedido.ENVIADO).length || 0,
        entregados: data?.filter(p => p.estado === EstadoPedido.ENTREGADO).length || 0,
        cancelados: data?.filter(p => p.estado === EstadoPedido.CANCELADO).length || 0
      };

      console.log('📊 Estadísticas de pedidos:', estadisticas);
      return estadisticas;
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasPedidos:', error);
      throw error;
    }
  }

  /**
   * Busca pedidos por término de búsqueda (cliente, email, ID de pago)
   * @param termino - Término de búsqueda
   * @returns Observable con pedidos que coinciden con la búsqueda
   */
  buscarPedidos(termino: string): Observable<Pedido[]> {
    console.log(`🔍 Buscando pedidos con término: ${termino}`);
    
    return from(supabase
      .from(TABLES.PEDIDOS)
      .select('*')
      .or(`clienteNombre.ilike.%${termino}%,clienteEmail.ilike.%${termino}%,paymentId.ilike.%${termino}%`)
      .order('fechaCreacion', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al buscar pedidos:', error);
          throw error;
        }
        console.log(`✅ Pedidos encontrados:`, data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en buscarPedidos:', error);
        throw error;
      })
    );
  }
}
