import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, query, where, orderBy, collectionData, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/**
 * ============================================================================
 * INTERFACES PARA PEDIDOS DE MERCADO PAGO
 * ============================================================================
 */

export interface PedidoMercadoPago {
  id: string;                           // ID único del pedido
  paymentId: string;                    // ID del pago en Mercado Pago
  preferenceId: string;                 // ID de la preferencia de MP
  estado: EstadoPedidoMP;               // Estado actual del pedido
  total: number;                        // Monto total del pedido
  moneda: string;                       // Moneda utilizada (ARS, USD, etc.)
  metodoPago?: string;                  // Método de pago usado
  items: ItemPedidoMP[];                // Productos comprados
  cliente: ClientePedidoMP;             // Información del cliente
  fechaCreacion: Date;                  // Fecha de creación del pedido
  fechaAprobacion?: Date;               // Fecha de aprobación del pago
  fechaActualizacion?: Date;            // Última actualización del estado
  motivoRechazo?: string;               // Motivo del rechazo si aplica
  detallesPago?: any;                   // Detalles completos del pago de MP
  metodoEntrega: string;                // Método de entrega seleccionado
  direccionEntrega?: string;            // Dirección de entrega si aplica
  notasCliente?: string;                // Notas adicionales del cliente
}

export interface ItemPedidoMP {
  id: string;                           // ID del producto
  nombre: string;                       // Nombre del producto
  cantidad: number;                     // Cantidad comprada
  precio: number;                       // Precio unitario
  subtotal: number;                     // Subtotal (precio * cantidad)
  categoria?: string;                   // Categoría del producto
  descripcion?: string;                 // Descripción del producto
}

export interface ClientePedidoMP {
  id: string;                           // ID del usuario
  email: string;                        // Email del cliente
  nombre: string;                       // Nombre del cliente
  apellido: string;                     // Apellido del cliente
  telefono?: string;                    // Teléfono del cliente
  documento?: string;                   // Documento del cliente
}

export enum EstadoPedidoMP {
  CREADO = 'creado',                    // Pedido creado, esperando pago
  PENDIENTE = 'pendiente',              // Pago en proceso de verificación
  APROBADO = 'aprobado',                // Pago aprobado
  COMPLETADO = 'completado',            // Pedido completado y entregado
  RECHAZADO = 'rechazado',              // Pago rechazado
  CANCELADO = 'cancelado',              // Pedido cancelado
  REEMBOLSADO = 'reembolsado'           // Pago reembolsado
}

/**
 * ============================================================================
 * SERVICIO PARA GESTIONAR PEDIDOS EN FIRESTORE
 * ============================================================================
 */

@Injectable({
  providedIn: 'root'
})
export class PedidosFirestoreService {
  private firestore = inject(Firestore);
  private pedidosCollection = collection(this.firestore, 'pedidos_mercadopago');

  constructor() {
    console.log('🔥 PedidosFirestoreService inicializado');
  }

  /**
   * ============================================================================
   * MÉTODOS PARA CREAR Y GUARDAR PEDIDOS
   * ============================================================================
   */

  /**
   * Crea un nuevo pedido en Firestore cuando se inicia el proceso de pago
   */
  async crearPedido(
    items: any[],
    usuario: any,
    metodoEntrega: string,
    preferenceId: string,
    direccionEntrega?: string,
    notasCliente?: string
  ): Promise<string> {
    try {
      console.log('💾 Creando pedido en Firestore...');

      // Calcular total
      const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

      // Mapear items al formato del pedido
      const itemsPedido: ItemPedidoMP[] = items.map(item => ({
        id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio: item.producto.precio,
        subtotal: item.producto.precio * item.cantidad,
        categoria: item.producto.categoria,
        descripcion: item.producto.descripcion
      }));

      // Crear objeto del pedido
      const pedido: Omit<PedidoMercadoPago, 'id'> = {
        paymentId: '', // Se actualizará cuando se procese el pago
        preferenceId: preferenceId,
        estado: EstadoPedidoMP.CREADO,
        total: total,
        moneda: 'ARS',
        items: itemsPedido,
        cliente: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          documento: usuario.documento
        },
        fechaCreacion: new Date(),
        metodoEntrega: metodoEntrega,
        direccionEntrega: direccionEntrega,
        notasCliente: notasCliente
      };

      // Guardar en Firestore
      const docRef = await addDoc(this.pedidosCollection, pedido);
      
      console.log('✅ Pedido creado con ID:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un pedido cuando cambia en Mercado Pago
   */
  async actualizarEstadoPedido(
    pedidoId: string,
    paymentId: string,
    nuevoEstado: EstadoPedidoMP,
    detallesPago?: any,
    metodoPago?: string,
    motivoRechazo?: string
  ): Promise<void> {
    try {
      console.log(`📝 Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);

      const pedidoRef = doc(this.firestore, 'pedidos_mercadopago', pedidoId);
      
      const datosActualizacion: any = {
        paymentId: paymentId,
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      };

      // Agregar datos específicos según el estado
      if (detallesPago) {
        datosActualizacion.detallesPago = detallesPago;
      }

      if (metodoPago) {
        datosActualizacion.metodoPago = metodoPago;
      }

      if (nuevoEstado === EstadoPedidoMP.APROBADO) {
        datosActualizacion.fechaAprobacion = new Date();
      }

      if (motivoRechazo) {
        datosActualizacion.motivoRechazo = motivoRechazo;
      }

      await updateDoc(pedidoRef, datosActualizacion);
      
      console.log(`✅ Pedido ${pedidoId} actualizado exitosamente`);

    } catch (error) {
      console.error('❌ Error actualizando pedido:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODOS PARA CONSULTAR PEDIDOS
   * ============================================================================
   */

  /**
   * Obtiene todos los pedidos de un usuario específico
   */
  obtenerPedidosUsuario(usuarioId: string): Observable<PedidoMercadoPago[]> {
    console.log(`🔍 Obteniendo pedidos para usuario: ${usuarioId}`);
    
    const q = query(
      this.pedidosCollection,
      where('cliente.id', '==', usuarioId),
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<PedidoMercadoPago[]>;
  }

  /**
   * Obtiene todos los pedidos (para administradores)
   */
  obtenerTodosLosPedidos(): Observable<PedidoMercadoPago[]> {
    console.log('📋 Obteniendo todos los pedidos...');
    
    const q = query(
      this.pedidosCollection,
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<PedidoMercadoPago[]>;
  }

  /**
   * Obtiene pedidos por estado
   */
  obtenerPedidosPorEstado(estado: EstadoPedidoMP): Observable<PedidoMercadoPago[]> {
    console.log(`🔍 Obteniendo pedidos con estado: ${estado}`);
    
    const q = query(
      this.pedidosCollection,
      where('estado', '==', estado),
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<PedidoMercadoPago[]>;
  }

  /**
   * Obtiene un pedido específico por ID
   */
  async obtenerPedidoPorId(pedidoId: string): Promise<PedidoMercadoPago | null> {
    try {
      const pedidoRef = doc(this.firestore, 'pedidos_mercadopago', pedidoId);
      const pedidoSnap = await getDoc(pedidoRef);
      
      if (pedidoSnap.exists()) {
        return { id: pedidoSnap.id, ...pedidoSnap.data() } as PedidoMercadoPago;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error obteniendo pedido:', error);
      return null;
    }
  }

  /**
   * Busca un pedido por preference ID de Mercado Pago
   */
  async obtenerPedidoPorPreferenceId(preferenceId: string): Promise<PedidoMercadoPago | null> {
    try {
      const q = query(
        this.pedidosCollection,
        where('preferenceId', '==', preferenceId)
      );
      
      const querySnapshot = await collectionData(q, { idField: 'id' });
      
      if (querySnapshot && querySnapshot.length > 0) {
        return querySnapshot[0] as PedidoMercadoPago;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error buscando pedido por preference ID:', error);
      return null;
    }
  }

  /**
   * ============================================================================
   * MÉTODOS DE UTILIDAD
   * ============================================================================
   */

  /**
   * Obtiene estadísticas de pedidos para el dashboard de admin
   */
  async obtenerEstadisticasPedidos(): Promise<any> {
    try {
      const todosPedidos = await collectionData(this.pedidosCollection);
      
      const estadisticas = {
        total: todosPedidos.length,
        completados: todosPedidos.filter(p => p['estado'] === EstadoPedidoMP.COMPLETADO).length,
        pendientes: todosPedidos.filter(p => p['estado'] === EstadoPedidoMP.PENDIENTE).length,
        rechazados: todosPedidos.filter(p => p['estado'] === EstadoPedidoMP.RECHAZADO).length,
        montoTotal: todosPedidos.reduce((sum, p) => sum + (p['total'] || 0), 0)
      };

      return estadisticas;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Convierte estado de Mercado Pago a nuestro enum
   */
  convertirEstadoMercadoPago(estadoMP: string): EstadoPedidoMP {
    const mapeoEstados: { [key: string]: EstadoPedidoMP } = {
      'approved': EstadoPedidoMP.APROBADO,
      'pending': EstadoPedidoMP.PENDIENTE,
      'rejected': EstadoPedidoMP.RECHAZADO,
      'cancelled': EstadoPedidoMP.CANCELADO,
      'refunded': EstadoPedidoMP.REEMBOLSADO,
      'charged_back': EstadoPedidoMP.REEMBOLSADO
    };

    return mapeoEstados[estadoMP] || EstadoPedidoMP.CREADO;
  }
}
