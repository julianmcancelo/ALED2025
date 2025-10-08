import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  moneda: string;                   // Moneda utilizada (ARS, USD, etc.)
  metodoPago: string;               // Método de pago usado
  items: ItemPedido[];              // Productos comprados
  cliente: ClientePedido;           // Información del cliente
  fechaCreacion: Date;              // Fecha de creación del pedido
  fechaAprobacion?: Date;           // Fecha de aprobación del pago
  fechaActualizacion?: Date;        // Última actualización del estado
  notasAdmin?: string;              // Notas internas del administrador
  numeroSeguimiento?: string;       // Número de seguimiento del envío
  detallesPago: any;               // Detalles del pago de Mercado Pago
}

/**
 * Interfaz para los items de un pedido
 */
export interface ItemPedido {
  id: string;                       // ID del producto
  nombre: string;                   // Nombre del producto
  cantidad: number;                 // Cantidad comprada
  precio: number;                   // Precio unitario
  subtotal: number;                 // Precio * cantidad
}

/**
 * Interfaz para la información del cliente
 */
export interface ClientePedido {
  email?: string;                   // Email del cliente
  nombre?: string;                  // Nombre del cliente
  apellido?: string;                // Apellido del cliente
  telefono?: string;                // Teléfono del cliente
}

/**
 * ============================================================================
 * SERVICIO DE GESTIÓN DE PEDIDOS
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

  // --- INYECCIÓN DE DEPENDENCIAS ---
  private firestore: Firestore = inject(Firestore);
  private pedidosCollection = collection(this.firestore, 'pedidos');

  constructor() {
    console.log('🛒 Servicio de Gestión de Pedidos inicializado');
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
    
    const q = query(
      this.pedidosCollection,
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  /**
   * Obtiene pedidos filtrados por estado
   * @param estado - Estado del pedido a filtrar
   * @returns Observable con pedidos del estado especificado
   */
  obtenerPedidosPorEstado(estado: EstadoPedido): Observable<Pedido[]> {
    console.log(`🔍 Filtrando pedidos por estado: ${estado}`);
    
    const q = query(
      this.pedidosCollection,
      where('estado', '==', estado),
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  /**
   * Obtiene pedidos pendientes (recién recibidos)
   * @returns Observable con pedidos pendientes
   */
  obtenerPedidosPendientes(): Observable<Pedido[]> {
    return this.obtenerPedidosPorEstado(EstadoPedido.PENDIENTE);
  }

  /**
   * Obtiene pedidos en proceso (confirmados, preparando, enviados)
   * @returns Observable con pedidos en proceso
   */
  obtenerPedidosEnProceso(): Observable<Pedido[]> {
    console.log('⚙️ Obteniendo pedidos en proceso...');
    
    const estadosEnProceso = [
      EstadoPedido.CONFIRMADO,
      EstadoPedido.PREPARANDO,
      EstadoPedido.ENVIADO
    ];
    
    const q = query(
      this.pedidosCollection,
      where('estado', 'in', estadosEnProceso),
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
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
   * @param notasAdmin - Notas opcionales del administrador
   * @returns Promise que se resuelve cuando se actualiza
   */
  async actualizarEstadoPedido(
    pedidoId: string, 
    nuevoEstado: EstadoPedido, 
    notasAdmin?: string
  ): Promise<void> {
    try {
      console.log(`📝 Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);
      
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
      
      const datosActualizacion: any = {
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      };
      
      // Agregar notas si se proporcionan
      if (notasAdmin) {
        datosActualizacion.notasAdmin = notasAdmin;
      }
      
      await updateDoc(pedidoRef, datosActualizacion);
      
      console.log(`✅ Pedido ${pedidoId} actualizado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error al actualizar estado del pedido:', error);
      throw error;
    }
  }

  /**
   * Agrega número de seguimiento a un pedido
   * @param pedidoId - ID del pedido
   * @param numeroSeguimiento - Número de seguimiento del envío
   * @returns Promise que se resuelve cuando se actualiza
   */
  async agregarNumeroSeguimiento(
    pedidoId: string, 
    numeroSeguimiento: string
  ): Promise<void> {
    try {
      console.log(`📦 Agregando número de seguimiento al pedido ${pedidoId}: ${numeroSeguimiento}`);
      
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
      
      await updateDoc(pedidoRef, {
        numeroSeguimiento: numeroSeguimiento,
        fechaActualizacion: new Date()
      });
      
      console.log(`✅ Número de seguimiento agregado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error al agregar número de seguimiento:', error);
      throw error;
    }
  }

  /**
   * Actualiza las notas del administrador para un pedido
   * @param pedidoId - ID del pedido
   * @param notas - Notas del administrador
   * @returns Promise que se resuelve cuando se actualiza
   */
  async actualizarNotasAdmin(pedidoId: string, notas: string): Promise<void> {
    try {
      console.log(`📝 Actualizando notas del pedido ${pedidoId}`);
      
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
      
      await updateDoc(pedidoRef, {
        notasAdmin: notas,
        fechaActualizacion: new Date()
      });
      
      console.log(`✅ Notas actualizadas exitosamente`);
      
    } catch (error) {
      console.error('❌ Error al actualizar notas:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODOS AUXILIARES
   * ============================================================================
   */

  /**
   * Obtiene el texto en español para un estado de pedido
   * @param estado - Estado del pedido
   * @returns Texto en español del estado
   */
  obtenerTextoEstado(estado: EstadoPedido): string {
    const textos = {
      [EstadoPedido.PENDIENTE]: 'Pendiente',
      [EstadoPedido.CONFIRMADO]: 'Confirmado',
      [EstadoPedido.PREPARANDO]: 'Preparando',
      [EstadoPedido.ENVIADO]: 'Enviado',
      [EstadoPedido.ENTREGADO]: 'Entregado',
      [EstadoPedido.CANCELADO]: 'Cancelado'
    };
    
    return textos[estado] || 'Desconocido';
  }

  /**
   * Obtiene la clase CSS para el color del estado
   * @param estado - Estado del pedido
   * @returns Clase CSS para el color
   */
  obtenerColorEstado(estado: EstadoPedido): string {
    const colores = {
      [EstadoPedido.PENDIENTE]: 'text-yellow-600 bg-yellow-100',
      [EstadoPedido.CONFIRMADO]: 'text-blue-600 bg-blue-100',
      [EstadoPedido.PREPARANDO]: 'text-purple-600 bg-purple-100',
      [EstadoPedido.ENVIADO]: 'text-orange-600 bg-orange-100',
      [EstadoPedido.ENTREGADO]: 'text-green-600 bg-green-100',
      [EstadoPedido.CANCELADO]: 'text-red-600 bg-red-100'
    };
    
    return colores[estado] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Formatea el total del pedido como moneda
   * @param total - Monto total
   * @param moneda - Código de moneda
   * @returns String formateado como moneda
   */
  formatearTotal(total: number, moneda: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda
    }).format(total);
  }
}
