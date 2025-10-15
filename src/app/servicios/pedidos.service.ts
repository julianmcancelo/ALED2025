/**
 * SERVICIO DE PEDIDOS - SISTEMA ALED2025
 * 
 * Maneja todas las operaciones relacionadas con pedidos del e-commerce.
 * Incluye creación, consulta, actualización y gestión de estados de pedidos.
 * Se integra con Firestore y el sistema de pagos virtuales.
 */

import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  runTransaction,
  Transaction
} from '@angular/fire/firestore';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

// Importamos los modelos y servicios necesarios
import {
  Pedido,
  ItemPedido,
  EstadoPedido,
  SolicitudCrearPedido,
  RespuestaApiPedido,
  EstadisticasPedidos,
  CambioEstado,
  InformacionPago,
  CONFIGURACION_PEDIDOS_DEFAULT
} from '../shared/models/pedido.model';

import { TarjetaVirtualService } from './tarjeta-virtual.service';
import { PagoVirtualService } from './pago-virtual.service';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  
  // --- INYECCIÓN DE DEPENDENCIAS ---
  
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private tarjetaVirtualService = inject(TarjetaVirtualService);
  private pagoVirtualService = inject(PagoVirtualService);
  
  // --- CONSTANTES ---
  
  private readonly COLECCION_PEDIDOS = 'pedidos';
  private readonly COLECCION_CONTADORES = 'contadores';
  
  // --- MÉTODOS PRINCIPALES ---
  
  /**
   * Crea un nuevo pedido en el sistema
   * 
   * @param solicitud - Datos del pedido a crear
   * @param usuarioId - ID del usuario que realiza el pedido
   * @returns Promise con la respuesta de la operación
   */
  async crearPedido(solicitud: SolicitudCrearPedido, usuarioId: string): Promise<RespuestaApiPedido> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🛒 Creando pedido para usuario: ${usuarioId}`);
        
        // Generar número de pedido único
        const numeroPedido = await this.generarNumeroPedido();
        
        // Calcular totales
        const { subtotal, items } = this.calcularTotales(solicitud.items);
        const costoEnvio = this.calcularCostoEnvio(subtotal);
        const total = subtotal + costoEnvio;
        
        // Crear el pedido
        const nuevoPedido: Omit<Pedido, 'id'> = {
          numeroPedido,
          usuarioId,
          cliente: await this.obtenerDatosCliente(usuarioId),
          estado: 'creado',
          items,
          envio: {
            ...solicitud.envio,
            costoEnvio,
            metodoEnvio: 'Envío estándar',
            tiempoEstimado: '3-5 días hábiles'
          },
          pago: {
            metodoPago: solicitud.metodoPago,
            estadoPago: 'pendiente',
            montoPagado: 0,
            moneda: CONFIGURACION_PEDIDOS_DEFAULT.MONEDA_DEFAULT
          },
          subtotal,
          totalDescuentos: 0,
          costoEnvio,
          total,
          notas: solicitud.notas,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          historialEstados: [{
            estadoNuevo: 'creado',
            fecha: new Date(),
            motivo: 'Pedido creado por el usuario'
          }],
          metadata: {
            origen: 'web',
            cuponDescuento: solicitud.cuponDescuento
          }
        };
        
        // Guardar en Firestore
        const pedidosCollection = collection(this.firestore, this.COLECCION_PEDIDOS);
        const docRef = await addDoc(pedidosCollection, {
          ...nuevoPedido,
          fechaCreacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });
        
        const pedidoCreado = {
          id: docRef.id,
          ...nuevoPedido
        };
        
        console.log(`✅ Pedido creado exitosamente: ${numeroPedido}`);
        
        return {
          exito: true,
          mensaje: 'Pedido creado correctamente',
          pedido: pedidoCreado
        };
        
      } catch (error) {
        console.error(`❌ Error al crear pedido:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al crear pedido',
          codigoError: 'CREAR_PEDIDO_ERROR',
          detallesError: error
        };
      }
    });
  }
  
  /**
   * Procesa el pago de un pedido
   * 
   * @param pedidoId - ID del pedido a pagar
   * @param usuarioId - ID del usuario
   * @returns Promise con la respuesta de la operación
   */
  async procesarPagoPedido(pedidoId: string, usuarioId: string): Promise<RespuestaApiPedido> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`💳 Procesando pago para pedido: ${pedidoId}`);
        
        const pedido = await this.obtenerPedidoPorId(pedidoId);
        if (!pedido.exito || !pedido.pedido) {
          return {
            exito: false,
            mensaje: 'Pedido no encontrado',
            codigoError: 'PEDIDO_NO_ENCONTRADO'
          };
        }
        
        const pedidoData = pedido.pedido;
        
        // Verificar que el pedido pertenece al usuario
        if (pedidoData.usuarioId !== usuarioId) {
          return {
            exito: false,
            mensaje: 'No tienes permisos para pagar este pedido',
            codigoError: 'PERMISOS_INSUFICIENTES'
          };
        }
        
        // Verificar estado del pedido
        if (pedidoData.estado !== 'creado') {
          return {
            exito: false,
            mensaje: 'El pedido no está en estado válido para pago',
            codigoError: 'ESTADO_INVALIDO'
          };
        }
        
        // Procesar pago según el método
        let resultadoPago: any;
        
        if (pedidoData.pago.metodoPago === 'tarjeta_virtual') {
          resultadoPago = await this.procesarPagoTarjetaVirtual(pedidoData, usuarioId);
        } else {
          return {
            exito: false,
            mensaje: 'Método de pago no implementado aún',
            codigoError: 'METODO_PAGO_NO_IMPLEMENTADO'
          };
        }
        
        if (!resultadoPago.exito) {
          // Actualizar pedido con pago rechazado
          await this.actualizarEstadoPedido(pedidoId, 'rechazado', 'Pago rechazado: ' + resultadoPago.mensaje);
          return resultadoPago;
        }
        
        // Actualizar pedido con pago exitoso
        const pedidoActualizado = await this.actualizarPagoPedido(pedidoId, {
          estadoPago: 'aprobado',
          transaccionId: resultadoPago.transaccionId,
          montoPagado: pedidoData.total,
          fechaPago: new Date()
        });
        
        // Cambiar estado a pagado
        await this.actualizarEstadoPedido(pedidoId, 'pagado', 'Pago procesado exitosamente');
        
        console.log(`✅ Pago procesado exitosamente para pedido: ${pedidoData.numeroPedido}`);
        
        return {
          exito: true,
          mensaje: 'Pago procesado correctamente',
          pedido: pedidoActualizado.pedido
        };
        
      } catch (error) {
        console.error(`❌ Error al procesar pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al procesar pago',
          codigoError: 'PROCESAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }
  
  /**
   * Obtiene los pedidos de un usuario
   * 
   * @param usuarioId - ID del usuario
   * @param limite - Número máximo de pedidos a obtener
   * @returns Promise con la lista de pedidos
   */
  async obtenerPedidosUsuario(usuarioId: string, limite: number = 50): Promise<RespuestaApiPedido> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`📋 Obteniendo pedidos para usuario: ${usuarioId}`);
        
        const pedidosCollection = collection(this.firestore, this.COLECCION_PEDIDOS);
        const q = query(
          pedidosCollection,
          where('usuarioId', '==', usuarioId),
          orderBy('fechaCreacion', 'desc'),
          limit(limite)
        );
        
        const querySnapshot = await getDocs(q);
        const pedidos: Pedido[] = [];
        
        querySnapshot.forEach((doc) => {
          const pedido = { id: doc.id, ...doc.data() } as Pedido;
          
          // Convertir timestamps de Firestore a Date
          if (pedido.fechaCreacion && typeof pedido.fechaCreacion === 'object') {
            pedido.fechaCreacion = (pedido.fechaCreacion as any).toDate();
          }
          if (pedido.fechaActualizacion && typeof pedido.fechaActualizacion === 'object') {
            pedido.fechaActualizacion = (pedido.fechaActualizacion as any).toDate();
          }
          
          pedidos.push(pedido);
        });
        
        console.log(`✅ Se obtuvieron ${pedidos.length} pedidos`);
        
        return {
          exito: true,
          mensaje: 'Pedidos obtenidos correctamente',
          pedidos
        };
        
      } catch (error) {
        console.error(`❌ Error al obtener pedidos:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al obtener pedidos',
          codigoError: 'OBTENER_PEDIDOS_ERROR',
          detallesError: error
        };
      }
    });
  }
  
  /**
   * Obtiene un pedido por su ID
   * 
   * @param pedidoId - ID del pedido
   * @returns Promise con el pedido
   */
  async obtenerPedidoPorId(pedidoId: string): Promise<RespuestaApiPedido> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const pedidoRef = doc(this.firestore, this.COLECCION_PEDIDOS, pedidoId);
        const pedidoSnap = await getDoc(pedidoRef);
        
        if (!pedidoSnap.exists()) {
          return {
            exito: false,
            mensaje: 'Pedido no encontrado',
            codigoError: 'PEDIDO_NO_ENCONTRADO'
          };
        }
        
        const pedido = { id: pedidoSnap.id, ...pedidoSnap.data() } as Pedido;
        
        // Convertir timestamps
        if (pedido.fechaCreacion && typeof pedido.fechaCreacion === 'object') {
          pedido.fechaCreacion = (pedido.fechaCreacion as any).toDate();
        }
        if (pedido.fechaActualizacion && typeof pedido.fechaActualizacion === 'object') {
          pedido.fechaActualizacion = (pedido.fechaActualizacion as any).toDate();
        }
        
        return {
          exito: true,
          mensaje: 'Pedido encontrado',
          pedido
        };
        
      } catch (error) {
        console.error(`❌ Error al obtener pedido:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al obtener pedido',
          codigoError: 'OBTENER_PEDIDO_ERROR',
          detallesError: error
        };
      }
    });
  }
  
  /**
   * Actualiza el estado de un pedido
   * 
   * @param pedidoId - ID del pedido
   * @param nuevoEstado - Nuevo estado del pedido
   * @param motivo - Motivo del cambio
   * @returns Promise con la respuesta de la operación
   */
  async actualizarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido, motivo?: string): Promise<RespuestaApiPedido> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const pedidoRef = doc(this.firestore, this.COLECCION_PEDIDOS, pedidoId);
        const pedidoSnap = await getDoc(pedidoRef);
        
        if (!pedidoSnap.exists()) {
          return {
            exito: false,
            mensaje: 'Pedido no encontrado',
            codigoError: 'PEDIDO_NO_ENCONTRADO'
          };
        }
        
        const pedidoActual = pedidoSnap.data() as Pedido;
        const estadoAnterior = pedidoActual.estado;
        
        // Crear registro de cambio de estado
        const cambioEstado: CambioEstado = {
          estadoAnterior,
          estadoNuevo: nuevoEstado,
          fecha: new Date(),
          motivo
        };
        
        // Actualizar pedido
        await updateDoc(pedidoRef, {
          estado: nuevoEstado,
          fechaActualizacion: serverTimestamp(),
          historialEstados: [...(pedidoActual.historialEstados || []), cambioEstado]
        });
        
        console.log(`✅ Estado de pedido actualizado: ${estadoAnterior} → ${nuevoEstado}`);
        
        return {
          exito: true,
          mensaje: 'Estado actualizado correctamente'
        };
        
      } catch (error) {
        console.error(`❌ Error al actualizar estado:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al actualizar estado',
          codigoError: 'ACTUALIZAR_ESTADO_ERROR',
          detallesError: error
        };
      }
    });
  }
  
  // --- MÉTODOS PRIVADOS ---
  
  /**
   * Genera un número de pedido único
   */
  private async generarNumeroPedido(): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${CONFIGURACION_PEDIDOS_DEFAULT.PREFIJO_NUMERO_PEDIDO}-${timestamp}-${random}`;
  }
  
  /**
   * Calcula los totales del pedido
   */
  private calcularTotales(items: Omit<ItemPedido, 'id' | 'subtotal'>[]): { subtotal: number; items: ItemPedido[] } {
    let subtotal = 0;
    const itemsConSubtotal: ItemPedido[] = items.map((item, index) => {
      const itemSubtotal = item.precioUnitario * item.cantidad;
      subtotal += itemSubtotal;
      
      return {
        ...item,
        id: `item-${index + 1}`,
        subtotal: itemSubtotal
      };
    });
    
    return { subtotal, items: itemsConSubtotal };
  }
  
  /**
   * Calcula el costo de envío
   */
  private calcularCostoEnvio(subtotal: number): number {
    if (subtotal >= CONFIGURACION_PEDIDOS_DEFAULT.MONTO_ENVIO_GRATIS) {
      return 0;
    }
    return CONFIGURACION_PEDIDOS_DEFAULT.COSTO_ENVIO_DEFAULT;
  }
  
  /**
   * Obtiene los datos del cliente
   */
  private async obtenerDatosCliente(usuarioId: string): Promise<any> {
    // En una implementación real, esto obtendría los datos del usuario desde Firestore
    return {
      nombre: 'Usuario',
      apellido: 'Demo',
      email: 'usuario@demo.com',
      telefono: '123456789'
    };
  }
  
  /**
   * Procesa pago con tarjeta virtual
   */
  private async procesarPagoTarjetaVirtual(pedido: Pedido, usuarioId: string): Promise<any> {
    try {
      // Obtener tarjeta virtual del usuario
      const tarjeta = await this.tarjetaVirtualService.obtenerTarjetaPorUsuario(usuarioId);
      if (!tarjeta || !tarjeta.id) {
        return {
          exito: false,
          mensaje: 'No se encontró tarjeta virtual para el usuario'
        };
      }

      // Crear intento de pago virtual
      const resultadoPago = await this.pagoVirtualService.crearIntentoPago({
        tarjetaId: tarjeta.id,
        monto: pedido.total,
        descripcion: `Pago pedido ${pedido.numeroPedido}`,
        referenciaExterna: pedido.id,
        claveIdempotencia: `pedido-${pedido.id}-${Date.now()}`
      }, usuarioId);
      
      if (!resultadoPago.exito) {
        return resultadoPago;
      }
      
      // Confirmar pago inmediatamente (simulación)
      const confirmacion = await this.pagoVirtualService.confirmarPago(
        resultadoPago.pago!.id!,
        usuarioId
      );
      
      return {
        exito: confirmacion.exito,
        mensaje: confirmacion.mensaje,
        transaccionId: confirmacion.pago?.transaccionId
      };
      
    } catch (error) {
      return {
        exito: false,
        mensaje: 'Error al procesar pago con tarjeta virtual',
        detallesError: error
      };
    }
  }
  
  /**
   * Actualiza la información de pago del pedido
   */
  private async actualizarPagoPedido(pedidoId: string, infoPago: Partial<InformacionPago>): Promise<RespuestaApiPedido> {
    const pedidoRef = doc(this.firestore, this.COLECCION_PEDIDOS, pedidoId);
    
    await updateDoc(pedidoRef, {
      'pago.estadoPago': infoPago.estadoPago,
      'pago.transaccionId': infoPago.transaccionId,
      'pago.montoPagado': infoPago.montoPagado,
      'pago.fechaPago': infoPago.fechaPago ? serverTimestamp() : null,
      fechaActualizacion: serverTimestamp()
    });
    
    return this.obtenerPedidoPorId(pedidoId);
  }
}
