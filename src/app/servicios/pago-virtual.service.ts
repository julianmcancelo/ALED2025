/**
 * SERVICIO DE PAGOS VIRTUALES
 * 
 * Este servicio simula el funcionamiento completo de un sistema de pagos
 * como Mercado Pago, permitiendo crear, autorizar, confirmar, anular y
 * reembolsar pagos utilizando las tarjetas virtuales del sistema.
 * 
 * Dependencias:
 * - @angular/fire/firestore: Para operaciones con la base de datos
 * - TarjetaVirtualService: Para validaciones y operaciones de tarjeta
 * - Modelos de pago virtual: Interfaces y tipos definidos
 * 
 * Flujo general:
 * 1. Crear intento de pago con validaciones iniciales
 * 2. Autorizar pago verificando saldo y estado de tarjeta
 * 3. Confirmar pago descontando el saldo y registrando transacción
 * 4. Permitir anulación antes de confirmación
 * 5. Permitir reembolso después de confirmación
 * 6. Mantener historial completo de todas las operaciones
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
  runTransaction,
  Transaction,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

// Importamos los servicios y modelos necesarios
import { TarjetaVirtualService } from './tarjeta-virtual.service';
import {
  PagoVirtual,
  TransaccionTarjeta,
  TarjetaVirtual,
  RespuestaApiTarjeta,
  SolicitudCrearPago,
  EstadoPago,
  TipoTransaccion
} from '../shared/models/tarjeta-virtual.model';

/**
 * Interfaz para respuestas específicas de operaciones de pago
 */
interface RespuestaPago {
  exito: boolean;
  mensaje: string;
  pago?: PagoVirtual;
  codigoError?: string;
  detallesError?: any;
}

/**
 * Servicio principal para la gestión de pagos virtuales
 * Implementa el flujo completo de pagos simulando Mercado Pago
 */
@Injectable({
  providedIn: 'root'
})
export class PagoVirtualService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private tarjetaService = inject(TarjetaVirtualService);

  // Referencias a las colecciones de Firestore
  private readonly COLECCION_PAGOS = 'pagos-virtuales';
  private readonly COLECCION_TRANSACCIONES = 'transacciones-tarjetas';

  /**
   * Crea un nuevo intento de pago virtual
   * Valida los datos iniciales pero no descuenta saldo hasta la confirmación
   * 
   * @param solicitud - Datos del pago a crear
   * @param usuarioId - ID del usuario que realiza el pago
   * @returns Promise con la respuesta del intento de pago
   */
  async crearIntentoPago(solicitud: SolicitudCrearPago, usuarioId: string): Promise<RespuestaPago> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`💳 Creando intento de pago:`, {
          usuarioId,
          tarjetaId: solicitud.tarjetaId,
          monto: solicitud.monto,
          descripcion: solicitud.descripcion
        });

        // 1. Validar que la clave de idempotencia no se haya usado antes
        await this.validarIdempotencia(solicitud.claveIdempotencia);

        // 2. Validar datos básicos del pago
        this.validarDatosPago(solicitud);

        // 3. Obtener y validar la tarjeta
        const tarjeta = await this.tarjetaService.obtenerTarjetaPorUsuario(usuarioId);
        if (!tarjeta) {
          throw new Error('No se encontró una tarjeta virtual para este usuario');
        }

        if (tarjeta.id !== solicitud.tarjetaId) {
          throw new Error('La tarjeta especificada no pertenece al usuario');
        }

        // 4. Validaciones iniciales de la tarjeta
        if (tarjeta.estado === 'bloqueada' || tarjeta.estado === 'suspendida') {
          throw new Error(`No se puede procesar el pago: tarjeta ${tarjeta.estado}`);
        }

        if (!tarjeta.habilitadaOnline) {
          throw new Error('La tarjeta no está habilitada para pagos online');
        }

        // 5. Crear el intento de pago
        const fechaActual = new Date();
        const nuevoPago: Omit<PagoVirtual, 'id'> = {
          tarjetaId: solicitud.tarjetaId,
          usuarioId,
          monto: solicitud.monto,
          descripcion: solicitud.descripcion,
          estado: 'pendiente',
          fechaCreacion: fechaActual,
          claveIdempotencia: solicitud.claveIdempotencia,
          referenciaExterna: solicitud.referenciaExterna,
          detalleProducto: solicitud.detalleProducto
        };

        // 6. Guardar en Firestore
        const pagosCollection = collection(this.firestore, this.COLECCION_PAGOS);
        const docRef = await addDoc(pagosCollection, {
          ...nuevoPago,
          fechaCreacion: serverTimestamp()
        });

        const pagoCreado = {
          id: docRef.id,
          ...nuevoPago
        };

        console.log(`✅ Intento de pago creado exitosamente:`, {
          pagoId: pagoCreado.id,
          monto: pagoCreado.monto,
          estado: pagoCreado.estado
        });

        return {
          exito: true,
          mensaje: 'Intento de pago creado correctamente',
          pago: pagoCreado
        };

      } catch (error) {
        console.error(`❌ Error al crear intento de pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al crear pago',
          codigoError: 'CREAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Autoriza un pago verificando saldo y condiciones
   * No descuenta el saldo, solo valida que el pago puede procesarse
   * 
   * @param pagoId - ID del pago a autorizar
   * @param usuarioId - ID del usuario que autoriza
   * @returns Promise con la respuesta de autorización
   */
  async autorizarPago(pagoId: string, usuarioId: string): Promise<RespuestaPago> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🔐 Autorizando pago:`, { pagoId, usuarioId });

        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // 1. Obtener el pago actual
          const pagoRef = doc(this.firestore, this.COLECCION_PAGOS, pagoId);
          const pagoDoc = await transaction.get(pagoRef);

          if (!pagoDoc.exists()) {
            throw new Error('Pago no encontrado');
          }

          const pago = { id: pagoDoc.id, ...pagoDoc.data() } as PagoVirtual;

          // 2. Validar que el pago pertenece al usuario
          if (pago.usuarioId !== usuarioId) {
            throw new Error('No tiene permisos para autorizar este pago');
          }

          // 3. Validar estado del pago
          if (pago.estado !== 'pendiente') {
            throw new Error(`No se puede autorizar un pago en estado: ${pago.estado}`);
          }

          // 4. Obtener y validar la tarjeta
          const tarjetaRef = doc(this.firestore, 'tarjetas-virtuales', pago.tarjetaId);
          const tarjetaDoc = await transaction.get(tarjetaRef);

          if (!tarjetaDoc.exists()) {
            throw new Error('Tarjeta virtual no encontrada');
          }

          const tarjeta = { id: tarjetaDoc.id, ...tarjetaDoc.data() } as TarjetaVirtual;

          // 5. Validar estado de la tarjeta
          if (tarjeta.estado !== 'activa') {
            throw new Error(`No se puede procesar el pago: tarjeta ${tarjeta.estado}`);
          }

          // 6. Validar saldo suficiente
          if (tarjeta.saldo < pago.monto) {
            // Actualizar pago como rechazado
            transaction.update(pagoRef, {
              estado: 'rechazado',
              motivoRechazo: 'Saldo insuficiente',
              fechaActualizacion: serverTimestamp()
            });

            throw new Error('Saldo insuficiente para procesar el pago');
          }

          // 7. Autorizar el pago
          transaction.update(pagoRef, {
            estado: 'autorizado',
            fechaAutorizacion: serverTimestamp()
          });

          return {
            ...pago,
            estado: 'autorizado' as EstadoPago,
            fechaAutorizacion: new Date()
          };
        });

        console.log(`✅ Pago autorizado exitosamente:`, {
          pagoId,
          monto: resultado.monto,
          estado: resultado.estado
        });

        return {
          exito: true,
          mensaje: 'Pago autorizado correctamente',
          pago: resultado
        };

      } catch (error) {
        console.error(`❌ Error al autorizar pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al autorizar pago',
          codigoError: 'AUTORIZAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Confirma un pago autorizado y descuenta el saldo de la tarjeta
   * Esta operación es irreversible (solo se puede reembolsar después)
   * 
   * @param pagoId - ID del pago a confirmar
   * @param usuarioId - ID del usuario que confirma
   * @returns Promise con la respuesta de confirmación
   */
  async confirmarPago(pagoId: string, usuarioId: string): Promise<RespuestaPago> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`✅ Confirmando pago:`, { pagoId, usuarioId });

        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // 1. Obtener el pago actual
          const pagoRef = doc(this.firestore, this.COLECCION_PAGOS, pagoId);
          const pagoDoc = await transaction.get(pagoRef);

          if (!pagoDoc.exists()) {
            throw new Error('Pago no encontrado');
          }

          const pago = { id: pagoDoc.id, ...pagoDoc.data() } as PagoVirtual;

          // 2. Validar que el pago pertenece al usuario
          if (pago.usuarioId !== usuarioId) {
            throw new Error('No tiene permisos para confirmar este pago');
          }

          // 3. Validar estado del pago
          if (pago.estado !== 'autorizado') {
            throw new Error(`No se puede confirmar un pago en estado: ${pago.estado}`);
          }

          // 4. Obtener y validar la tarjeta
          const tarjetaRef = doc(this.firestore, 'tarjetas-virtuales', pago.tarjetaId);
          const tarjetaDoc = await transaction.get(tarjetaRef);

          if (!tarjetaDoc.exists()) {
            throw new Error('Tarjeta virtual no encontrada');
          }

          const tarjeta = { id: tarjetaDoc.id, ...tarjetaDoc.data() } as TarjetaVirtual;

          // 5. Validar saldo suficiente (verificación adicional)
          if (tarjeta.saldo < pago.monto) {
            throw new Error('Saldo insuficiente para confirmar el pago');
          }

          // 6. Descontar el saldo de la tarjeta
          const nuevoSaldo = tarjeta.saldo - pago.monto;
          transaction.update(tarjetaRef, {
            saldo: nuevoSaldo,
            fechaActualizacion: serverTimestamp()
          });

          // 7. Confirmar el pago
          transaction.update(pagoRef, {
            estado: 'confirmado',
            fechaConfirmacion: serverTimestamp()
          });

          // 8. Crear registro de transacción
          const transaccion: Omit<TransaccionTarjeta, 'id'> = {
            tarjetaId: pago.tarjetaId,
            usuarioId: pago.usuarioId,
            tipo: 'pago',
            monto: -pago.monto, // Negativo porque es un egreso
            saldoAnterior: tarjeta.saldo,
            saldoNuevo: nuevoSaldo,
            descripcion: `Pago confirmado: ${pago.descripcion}`,
            fecha: new Date(),
            pagoId: pago.id,
            claveIdempotencia: `pago-${pago.id}-${Date.now()}`
          };

          console.log(`💳 Creando transacción de pago:`, {
            tarjetaId: pago.tarjetaId,
            usuarioId: pago.usuarioId,
            monto: transaccion.monto,
            descripcion: transaccion.descripcion
          });

          const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
          const transaccionRef = doc(transaccionesCollection);
          
          // Filtrar valores undefined, null y strings vacíos antes de guardar en Firestore
          const transaccionData = Object.fromEntries(
            Object.entries({
              ...transaccion,
              fecha: serverTimestamp()
            }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
          
          transaction.set(transaccionRef, transaccionData);
          
          console.log(`✅ Transacción de pago guardada con ID: ${transaccionRef.id}`);
          console.log(`✅ Datos guardados:`, transaccionData);

          return {
            ...pago,
            estado: 'confirmado' as EstadoPago,
            fechaConfirmacion: new Date(),
            transaccionId: transaccionRef.id
          };
        });

        console.log(`✅ Pago confirmado exitosamente:`, {
          pagoId,
          monto: resultado.monto,
          estado: resultado.estado
        });

        return {
          exito: true,
          mensaje: 'Pago confirmado y procesado correctamente',
          pago: resultado
        };

      } catch (error) {
        console.error(`❌ Error al confirmar pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al confirmar pago',
          codigoError: 'CONFIRMAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Anula un pago antes de que sea confirmado
   * Solo se puede anular pagos en estado 'pendiente' o 'autorizado'
   * 
   * @param pagoId - ID del pago a anular
   * @param usuarioId - ID del usuario que anula
   * @param motivo - Motivo de la anulación
   * @returns Promise con la respuesta de anulación
   */
  async anularPago(pagoId: string, usuarioId: string, motivo?: string): Promise<RespuestaPago> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`❌ Anulando pago:`, { pagoId, usuarioId, motivo });

        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // 1. Obtener el pago actual
          const pagoRef = doc(this.firestore, this.COLECCION_PAGOS, pagoId);
          const pagoDoc = await transaction.get(pagoRef);

          if (!pagoDoc.exists()) {
            throw new Error('Pago no encontrado');
          }

          const pago = { id: pagoDoc.id, ...pagoDoc.data() } as PagoVirtual;

          // 2. Validar que el pago pertenece al usuario
          if (pago.usuarioId !== usuarioId) {
            throw new Error('No tiene permisos para anular este pago');
          }

          // 3. Validar estado del pago
          if (pago.estado !== 'pendiente' && pago.estado !== 'autorizado') {
            throw new Error(`No se puede anular un pago en estado: ${pago.estado}`);
          }

          // 4. Anular el pago
          transaction.update(pagoRef, {
            estado: 'anulado',
            fechaAnulacion: serverTimestamp(),
            motivoRechazo: motivo || 'Anulado por el usuario'
          });

          return {
            ...pago,
            estado: 'anulado' as EstadoPago,
            fechaAnulacion: new Date(),
            motivoRechazo: motivo || 'Anulado por el usuario'
          };
        });

        console.log(`✅ Pago anulado exitosamente:`, {
          pagoId,
          estadoAnterior: 'autorizado',
          estadoNuevo: resultado.estado
        });

        return {
          exito: true,
          mensaje: 'Pago anulado correctamente',
          pago: resultado
        };

      } catch (error) {
        console.error(`❌ Error al anular pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al anular pago',
          codigoError: 'ANULAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Reembolsa un pago confirmado devolviendo el dinero a la tarjeta
   * Solo se puede reembolsar pagos en estado 'confirmado'
   * 
   * @param pagoId - ID del pago a reembolsar
   * @param usuarioId - ID del usuario (para validación)
   * @param motivo - Motivo del reembolso
   * @returns Promise con la respuesta de reembolso
   */
  async reembolsarPago(pagoId: string, usuarioId: string, motivo?: string): Promise<RespuestaPago> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`💰 Reembolsando pago:`, { pagoId, usuarioId, motivo });

        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // 1. Obtener el pago actual
          const pagoRef = doc(this.firestore, this.COLECCION_PAGOS, pagoId);
          const pagoDoc = await transaction.get(pagoRef);

          if (!pagoDoc.exists()) {
            throw new Error('Pago no encontrado');
          }

          const pago = { id: pagoDoc.id, ...pagoDoc.data() } as PagoVirtual;

          // 2. Validar que el pago pertenece al usuario
          if (pago.usuarioId !== usuarioId) {
            throw new Error('No tiene permisos para reembolsar este pago');
          }

          // 3. Validar estado del pago
          if (pago.estado !== 'confirmado') {
            throw new Error(`No se puede reembolsar un pago en estado: ${pago.estado}`);
          }

          // 4. Obtener la tarjeta
          const tarjetaRef = doc(this.firestore, 'tarjetas-virtuales', pago.tarjetaId);
          const tarjetaDoc = await transaction.get(tarjetaRef);

          if (!tarjetaDoc.exists()) {
            throw new Error('Tarjeta virtual no encontrada');
          }

          const tarjeta = { id: tarjetaDoc.id, ...tarjetaDoc.data() } as TarjetaVirtual;

          // 5. Validar límite máximo de saldo
          const nuevoSaldo = tarjeta.saldo + pago.monto;
          if (nuevoSaldo > tarjeta.limiteMaximo) {
            throw new Error(`El reembolso excedería el límite máximo de saldo ($${tarjeta.limiteMaximo})`);
          }

          // 6. Devolver el dinero a la tarjeta
          transaction.update(tarjetaRef, {
            saldo: nuevoSaldo,
            fechaActualizacion: serverTimestamp()
          });

          // 7. Marcar el pago como reembolsado
          transaction.update(pagoRef, {
            estado: 'reembolsado',
            fechaAnulacion: serverTimestamp(),
            motivoRechazo: motivo || 'Reembolso solicitado por el usuario'
          });

          // 8. Crear registro de transacción de reembolso
          const transaccion: Omit<TransaccionTarjeta, 'id'> = {
            tarjetaId: pago.tarjetaId,
            usuarioId: pago.usuarioId,
            tipo: 'reembolso',
            monto: pago.monto, // Positivo porque es un ingreso
            saldoAnterior: tarjeta.saldo,
            saldoNuevo: nuevoSaldo,
            descripcion: `Reembolso: ${pago.descripcion}`,
            fecha: new Date(),
            pagoId: pago.id,
            claveIdempotencia: `reembolso-${pago.id}-${Date.now()}`
          };

          const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
          const transaccionRef = doc(transaccionesCollection);
          
          // Filtrar valores undefined, null y strings vacíos antes de guardar en Firestore
          const transaccionData = Object.fromEntries(
            Object.entries({
              ...transaccion,
              fecha: serverTimestamp()
            }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
          
          transaction.set(transaccionRef, transaccionData);

          return {
            ...pago,
            estado: 'reembolsado' as EstadoPago,
            fechaAnulacion: new Date(),
            motivoRechazo: motivo || 'Reembolso solicitado por el usuario'
          };
        });

        console.log(`✅ Pago reembolsado exitosamente:`, {
          pagoId,
          monto: resultado.monto,
          estado: resultado.estado
        });

        return {
          exito: true,
          mensaje: 'Pago reembolsado correctamente',
          pago: resultado
        };

      } catch (error) {
        console.error(`❌ Error al reembolsar pago:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al reembolsar pago',
          codigoError: 'REEMBOLSAR_PAGO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Obtiene el historial de pagos de un usuario
   * 
   * @param usuarioId - ID del usuario
   * @param limite - Número máximo de pagos a obtener
   * @returns Promise con el array de pagos
   */
  async obtenerHistorialPagos(usuarioId: string, limite: number = 50): Promise<PagoVirtual[]> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`📋 Obteniendo historial de pagos para usuario: ${usuarioId}`);

        const pagosCollection = collection(this.firestore, this.COLECCION_PAGOS);
        const q = query(
          pagosCollection,
          where('usuarioId', '==', usuarioId),
          orderBy('fechaCreacion', 'desc'),
          limit(limite)
        );

        const querySnapshot = await getDocs(q);
        const pagos: PagoVirtual[] = [];

        querySnapshot.forEach((doc) => {
          const pago = { id: doc.id, ...doc.data() } as PagoVirtual;
          
          // Convertir timestamps de Firestore a Date
          if (pago.fechaCreacion && typeof pago.fechaCreacion === 'object') {
            pago.fechaCreacion = (pago.fechaCreacion as any).toDate();
          }
          if (pago.fechaAutorizacion && typeof pago.fechaAutorizacion === 'object') {
            pago.fechaAutorizacion = (pago.fechaAutorizacion as any).toDate();
          }
          if (pago.fechaConfirmacion && typeof pago.fechaConfirmacion === 'object') {
            pago.fechaConfirmacion = (pago.fechaConfirmacion as any).toDate();
          }
          if (pago.fechaAnulacion && typeof pago.fechaAnulacion === 'object') {
            pago.fechaAnulacion = (pago.fechaAnulacion as any).toDate();
          }
          
          pagos.push(pago);
        });

        console.log(`✅ Se obtuvieron ${pagos.length} pagos`);
        return pagos;

      } catch (error) {
        console.error(`❌ Error al obtener historial de pagos:`, error);
        throw new Error(`No se pudo obtener el historial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * Obtiene un pago específico por su ID
   * 
   * @param pagoId - ID del pago
   * @param usuarioId - ID del usuario (para validación)
   * @returns Promise con los datos del pago
   */
  async obtenerPago(pagoId: string, usuarioId: string): Promise<PagoVirtual | null> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const pagoRef = doc(this.firestore, this.COLECCION_PAGOS, pagoId);
        const pagoDoc = await getDoc(pagoRef);

        if (!pagoDoc.exists()) {
          return null;
        }

        const pago = { id: pagoDoc.id, ...pagoDoc.data() } as PagoVirtual;

        // Validar que el pago pertenece al usuario
        if (pago.usuarioId !== usuarioId) {
          throw new Error('No tiene permisos para ver este pago');
        }

        // Convertir timestamps de Firestore a Date
        if (pago.fechaCreacion && typeof pago.fechaCreacion === 'object') {
          pago.fechaCreacion = (pago.fechaCreacion as any).toDate();
        }
        if (pago.fechaAutorizacion && typeof pago.fechaAutorizacion === 'object') {
          pago.fechaAutorizacion = (pago.fechaAutorizacion as any).toDate();
        }
        if (pago.fechaConfirmacion && typeof pago.fechaConfirmacion === 'object') {
          pago.fechaConfirmacion = (pago.fechaConfirmacion as any).toDate();
        }
        if (pago.fechaAnulacion && typeof pago.fechaAnulacion === 'object') {
          pago.fechaAnulacion = (pago.fechaAnulacion as any).toDate();
        }

        return pago;

      } catch (error) {
        console.error(`❌ Error al obtener pago:`, error);
        throw new Error(`No se pudo obtener el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * Valida los datos básicos de un pago antes de crearlo
   * 
   * @param solicitud - Datos del pago a validar
   * @throws Error si los datos no son válidos
   */
  private validarDatosPago(solicitud: SolicitudCrearPago): void {
    if (!solicitud.tarjetaId || solicitud.tarjetaId.trim() === '') {
      throw new Error('ID de tarjeta es requerido');
    }

    if (!solicitud.monto || solicitud.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    if (solicitud.monto > 999999) {
      throw new Error('El monto excede el límite máximo permitido');
    }

    if (!solicitud.descripcion || solicitud.descripcion.trim() === '') {
      throw new Error('La descripción del pago es requerida');
    }

    if (solicitud.descripcion.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }
  }

  /**
   * Valida que una clave de idempotencia no haya sido utilizada antes
   * 
   * @param claveIdempotencia - Clave única de la operación
   * @throws Error si la clave ya fue utilizada
   */
  private async validarIdempotencia(claveIdempotencia: string): Promise<void> {
    const pagosCollection = collection(this.firestore, this.COLECCION_PAGOS);
    const q = query(pagosCollection, where('claveIdempotencia', '==', claveIdempotencia), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Esta operación ya fue procesada anteriormente');
    }
  }
}
