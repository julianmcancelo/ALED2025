/**
 * SERVICIO DE TARJETA VIRTUAL
 * 
 * Este servicio maneja todas las operaciones relacionadas con las tarjetas virtuales
 * de prueba del sistema. Proporciona funcionalidades para crear, consultar, modificar
 * y gestionar tarjetas virtuales almacenadas en Firestore.
 * 
 * Dependencias:
 * - @angular/fire/firestore: Para operaciones con la base de datos
 * - RxJS: Para manejo de observables y operaciones asíncronas
 * - Modelos de tarjeta virtual: Interfaces y tipos definidos
 * 
 * Flujo general:
 * 1. Creación automática de tarjeta al registrar usuario
 * 2. Consulta y visualización de datos de tarjeta
 * 3. Modificación de saldo por administradores
 * 4. Gestión de estados (bloqueo/desbloqueo)
 * 5. Registro completo de transacciones para auditoría
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

// Importamos los modelos y tipos necesarios
import {
  TarjetaVirtual,
  TransaccionTarjeta,
  OperacionAdmin,
  RespuestaApiTarjeta,
  SolicitudModificarSaldo,
  EstadoTarjeta,
  TipoTransaccion,
  CONFIGURACION_TARJETA_DEFAULT
} from '../shared/models/tarjeta-virtual.model';
import { ConfiguracionTarjetaService } from './configuracion-tarjeta.service';

/**
 * Servicio principal para la gestión de tarjetas virtuales
 * Implementa todas las operaciones CRUD y lógica de negocio
 */
@Injectable({
  providedIn: 'root'
})
export class TarjetaVirtualService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private configuracionService = inject(ConfiguracionTarjetaService);

  // Referencias a las colecciones de Firestore
  private readonly COLECCION_TARJETAS = 'tarjetas-virtuales';
  private readonly COLECCION_TRANSACCIONES = 'transacciones-tarjetas';
  private readonly COLECCION_OPERACIONES_ADMIN = 'operaciones-admin';

  /**
   * Crea automáticamente una tarjeta virtual para un nuevo usuario
   * Se ejecuta durante el proceso de registro
   * 
   * @param usuarioId - ID único del usuario en Firestore
   * @param nombreCompleto - Nombre y apellido del usuario para el titular
   * @returns Promise con los datos de la tarjeta creada
   * @throws Error si no se puede crear la tarjeta o si ya existe una
   */
  async crearTarjetaParaUsuario(usuarioId: string, nombreCompleto: string): Promise<TarjetaVirtual> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🎯 Iniciando creación de tarjeta virtual para usuario: ${usuarioId}`);

        // 1. Verificar que el usuario no tenga ya una tarjeta
        const tarjetaExistente = await this.obtenerTarjetaPorUsuario(usuarioId);
        if (tarjetaExistente) {
          console.warn(`⚠️ El usuario ${usuarioId} ya tiene una tarjeta virtual`);
          throw new Error('El usuario ya tiene una tarjeta virtual asignada');
        }

        // 2. Obtener configuración personalizada
        await this.configuracionService.cargarConfiguracion();
        const configuracion = this.configuracionService.configuracionActual();

        // 3. Generar datos únicos para la nueva tarjeta
        const numeroTarjeta = this.configuracionService.generarNumeroTarjeta();
        const fechaVencimiento = this.generarFechaVencimiento();
        const cvv = this.generarCVV();
        const fechaActual = new Date();

        // 4. Crear el objeto tarjeta con valores personalizados
        const nuevaTarjeta: Omit<TarjetaVirtual, 'id'> = {
          usuarioId,
          numero: numeroTarjeta,
          titular: nombreCompleto.toUpperCase(),
          fechaVencimiento,
          cvv,
          saldo: CONFIGURACION_TARJETA_DEFAULT.SALDO_INICIAL,
          estado: CONFIGURACION_TARJETA_DEFAULT.ESTADO_INICIAL,
          fechaCreacion: fechaActual,
          fechaActualizacion: fechaActual,
          limiteMaximo: CONFIGURACION_TARJETA_DEFAULT.LIMITE_MAXIMO,
          habilitadaOnline: true,
          // Campos personalizables
          tipoTarjeta: configuracion?.tipoTarjetaDefault || CONFIGURACION_TARJETA_DEFAULT.TIPO_TARJETA_DEFAULT,
          nombreBanco: configuracion?.nombreBanco || CONFIGURACION_TARJETA_DEFAULT.NOMBRE_BANCO_DEFAULT,
          logoBase64: configuracion?.logoBase64 || undefined
        };

        // 4. Guardar en Firestore usando transacción para garantizar consistencia
        const tarjetaRef = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // Crear la tarjeta
          const tarjetasCollection = collection(this.firestore, this.COLECCION_TARJETAS);
          const docRef = doc(tarjetasCollection);
          
          transaction.set(docRef, {
            ...nuevaTarjeta,
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          });

          // Crear la primera transacción (saldo inicial)
          const transaccionInicial: Omit<TransaccionTarjeta, 'id'> = {
            tarjetaId: docRef.id,
            usuarioId,
            tipo: 'recarga',
            monto: CONFIGURACION_TARJETA_DEFAULT.SALDO_INICIAL,
            saldoAnterior: 0,
            saldoNuevo: CONFIGURACION_TARJETA_DEFAULT.SALDO_INICIAL,
            descripcion: 'Saldo inicial al crear la tarjeta virtual',
            fecha: fechaActual,
            claveIdempotencia: `inicial-${docRef.id}-${Date.now()}`
          };

          const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
          const transaccionRef = doc(transaccionesCollection);
          
          // Filtrar valores undefined, null y strings vacíos antes de guardar en Firestore
          const transaccionData = Object.fromEntries(
            Object.entries({
              ...transaccionInicial,
              fecha: serverTimestamp()
            }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
          
          transaction.set(transaccionRef, transaccionData);

          return docRef;
        });

        // 5. Obtener la tarjeta creada con su ID
        const tarjetaCreada = {
          id: tarjetaRef.id,
          ...nuevaTarjeta
        };

        console.log(`✅ Tarjeta virtual creada exitosamente:`, {
          id: tarjetaCreada.id,
          numero: this.enmascararNumeroTarjeta(tarjetaCreada.numero),
          titular: tarjetaCreada.titular,
          saldo: tarjetaCreada.saldo
        });

        return tarjetaCreada;

      } catch (error) {
        console.error(`❌ Error al crear tarjeta virtual para usuario ${usuarioId}:`, error);
        throw new Error(`No se pudo crear la tarjeta virtual: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * Obtiene la tarjeta virtual de un usuario específico
   * Utilizado para mostrar la tarjeta en el perfil del usuario
   * 
   * @param usuarioId - ID del usuario propietario
   * @returns Promise con los datos de la tarjeta o null si no existe
   */
  async obtenerTarjetaPorUsuario(usuarioId: string): Promise<TarjetaVirtual | null> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🔍 Buscando tarjeta virtual para usuario: ${usuarioId}`);

        const tarjetasCollection = collection(this.firestore, this.COLECCION_TARJETAS);
        const q = query(tarjetasCollection, where('usuarioId', '==', usuarioId), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log(`📭 No se encontró tarjeta virtual para usuario: ${usuarioId}`);
          return null;
        }

        const docSnapshot = querySnapshot.docs[0];
        const tarjeta = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as TarjetaVirtual;

        // Convertir timestamps de Firestore a Date
        if (tarjeta.fechaCreacion && typeof tarjeta.fechaCreacion === 'object') {
          tarjeta.fechaCreacion = (tarjeta.fechaCreacion as any).toDate();
        }
        if (tarjeta.fechaActualizacion && typeof tarjeta.fechaActualizacion === 'object') {
          tarjeta.fechaActualizacion = (tarjeta.fechaActualizacion as any).toDate();
        }

        console.log(`✅ Tarjeta encontrada:`, {
          id: tarjeta.id,
          numero: this.enmascararNumeroTarjeta(tarjeta.numero),
          saldo: tarjeta.saldo,
          estado: tarjeta.estado
        });

        return tarjeta;

      } catch (error) {
        console.error(`❌ Error al obtener tarjeta para usuario ${usuarioId}:`, error);
        throw new Error(`No se pudo obtener la tarjeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * Modifica el saldo de una tarjeta virtual (solo administradores)
   * Registra la operación en el historial de transacciones
   * 
   * @param solicitud - Datos de la modificación de saldo
   * @param adminId - ID del administrador que realiza la operación
   * @param adminNombre - Nombre del administrador
   * @returns Promise con la respuesta de la operación
   */
  async modificarSaldo(
    solicitud: SolicitudModificarSaldo,
    adminId: string,
    adminNombre: string
  ): Promise<RespuestaApiTarjeta> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🔧 Iniciando modificación de saldo:`, {
          tarjetaId: solicitud.tarjetaId,
          monto: solicitud.monto,
          admin: adminNombre
        });

        // 1. Validar que la clave de idempotencia no se haya usado antes
        await this.validarIdempotencia(solicitud.claveIdempotencia);

        // 2. Ejecutar la modificación en una transacción atómica
        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // Obtener la tarjeta actual
          const tarjetaRef = doc(this.firestore, this.COLECCION_TARJETAS, solicitud.tarjetaId);
          const tarjetaDoc = await transaction.get(tarjetaRef);

          if (!tarjetaDoc.exists()) {
            throw new Error('Tarjeta virtual no encontrada');
          }

          const tarjetaActual = { id: tarjetaDoc.id, ...tarjetaDoc.data() } as TarjetaVirtual;

          // Validar que la tarjeta no esté bloqueada para modificaciones
          if (tarjetaActual.estado === 'suspendida') {
            throw new Error('No se puede modificar el saldo de una tarjeta suspendida');
          }

          // Calcular el nuevo saldo
          const nuevoSaldo = tarjetaActual.saldo + solicitud.monto;

          // Validar límites de saldo
          if (nuevoSaldo < 0) {
            throw new Error('El saldo no puede ser negativo');
          }
          if (nuevoSaldo > tarjetaActual.limiteMaximo) {
            throw new Error(`El saldo no puede exceder el límite máximo de $${tarjetaActual.limiteMaximo}`);
          }

          // Actualizar la tarjeta
          transaction.update(tarjetaRef, {
            saldo: nuevoSaldo,
            fechaActualizacion: serverTimestamp()
          });

          // Crear registro de transacción
          const transaccion: Omit<TransaccionTarjeta, 'id'> = {
            tarjetaId: solicitud.tarjetaId,
            usuarioId: tarjetaActual.usuarioId,
            tipo: solicitud.monto > 0 ? 'recarga' : 'descuento',
            monto: solicitud.monto,
            saldoAnterior: tarjetaActual.saldo,
            saldoNuevo: nuevoSaldo,
            descripcion: solicitud.descripcion,
            fecha: new Date(),
            adminId,
            claveIdempotencia: solicitud.claveIdempotencia
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

          // Crear registro de operación administrativa
          const operacionAdmin: Omit<OperacionAdmin, 'id'> = {
            adminId,
            adminNombre,
            tarjetaId: solicitud.tarjetaId,
            usuarioId: tarjetaActual.usuarioId,
            tipoOperacion: 'modificar_saldo',
            descripcion: `Modificación de saldo: ${solicitud.monto > 0 ? '+' : ''}${solicitud.monto}`,
            valoresAnteriores: { saldo: tarjetaActual.saldo },
            valoresNuevos: { saldo: nuevoSaldo },
            fecha: new Date(),
            justificacion: solicitud.justificacion
          };

          const operacionesCollection = collection(this.firestore, this.COLECCION_OPERACIONES_ADMIN);
          const operacionRef = doc(operacionesCollection);
          
          // Filtrar valores undefined, null y strings vacíos antes de guardar en Firestore
          const operacionData = Object.fromEntries(
            Object.entries({
              ...operacionAdmin,
              fecha: serverTimestamp()
            }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
          
          transaction.set(operacionRef, operacionData);

          return {
            ...tarjetaActual,
            saldo: nuevoSaldo,
            fechaActualizacion: new Date()
          };
        });

        console.log(`✅ Saldo modificado exitosamente:`, {
          tarjetaId: solicitud.tarjetaId,
          saldoAnterior: resultado.saldo - solicitud.monto,
          saldoNuevo: resultado.saldo,
          diferencia: solicitud.monto
        });

        return {
          exito: true,
          mensaje: 'Saldo modificado correctamente',
          tarjeta: resultado
        };

      } catch (error) {
        console.error(`❌ Error al modificar saldo:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al modificar saldo',
          codigoError: 'MODIFICAR_SALDO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Bloquea o desbloquea una tarjeta virtual
   * Solo puede ser ejecutado por administradores
   * 
   * @param tarjetaId - ID de la tarjeta a modificar
   * @param nuevoEstado - Nuevo estado de la tarjeta
   * @param adminId - ID del administrador
   * @param adminNombre - Nombre del administrador
   * @param justificacion - Motivo del cambio de estado
   * @returns Promise con la respuesta de la operación
   */
  async cambiarEstadoTarjeta(
    tarjetaId: string,
    nuevoEstado: EstadoTarjeta,
    adminId: string,
    adminNombre: string,
    justificacion?: string
  ): Promise<RespuestaApiTarjeta> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`🔒 Cambiando estado de tarjeta:`, {
          tarjetaId,
          nuevoEstado,
          admin: adminNombre
        });

        const resultado = await runTransaction(this.firestore, async (transaction: Transaction) => {
          // Obtener la tarjeta actual
          const tarjetaRef = doc(this.firestore, this.COLECCION_TARJETAS, tarjetaId);
          const tarjetaDoc = await transaction.get(tarjetaRef);

          if (!tarjetaDoc.exists()) {
            throw new Error('Tarjeta virtual no encontrada');
          }

          const tarjetaActual = { id: tarjetaDoc.id, ...tarjetaDoc.data() } as TarjetaVirtual;
          const estadoAnterior = tarjetaActual.estado;

          // Validar que el estado sea diferente
          if (estadoAnterior === nuevoEstado) {
            throw new Error(`La tarjeta ya se encuentra en estado: ${nuevoEstado}`);
          }

          // Actualizar el estado de la tarjeta
          transaction.update(tarjetaRef, {
            estado: nuevoEstado,
            fechaActualizacion: serverTimestamp()
          });

          // Crear registro de transacción para el cambio de estado
          const tipoTransaccion: TipoTransaccion = nuevoEstado === 'bloqueada' ? 'bloqueo' : 'desbloqueo';
          const transaccion: Omit<TransaccionTarjeta, 'id'> = {
            tarjetaId,
            usuarioId: tarjetaActual.usuarioId,
            tipo: tipoTransaccion,
            monto: 0,
            saldoAnterior: tarjetaActual.saldo,
            saldoNuevo: tarjetaActual.saldo,
            descripcion: `Cambio de estado: ${estadoAnterior} → ${nuevoEstado}`,
            fecha: new Date(),
            adminId,
            claveIdempotencia: `estado-${tarjetaId}-${Date.now()}`
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

          // Crear registro de operación administrativa
          const operacionAdmin: Omit<OperacionAdmin, 'id'> = {
            adminId,
            adminNombre,
            tarjetaId,
            usuarioId: tarjetaActual.usuarioId,
            tipoOperacion: nuevoEstado === 'bloqueada' ? 'bloquear_tarjeta' : 'desbloquear_tarjeta',
            descripcion: `Cambio de estado de tarjeta: ${estadoAnterior} → ${nuevoEstado}`,
            valoresAnteriores: { estado: estadoAnterior },
            valoresNuevos: { estado: nuevoEstado },
            fecha: new Date(),
            justificacion
          };

          const operacionesCollection = collection(this.firestore, this.COLECCION_OPERACIONES_ADMIN);
          const operacionRef = doc(operacionesCollection);
          
          // Filtrar valores undefined, null y strings vacíos antes de guardar en Firestore
          const operacionData = Object.fromEntries(
            Object.entries({
              ...operacionAdmin,
              fecha: serverTimestamp()
            }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
          
          transaction.set(operacionRef, operacionData);

          return {
            ...tarjetaActual,
            estado: nuevoEstado,
            fechaActualizacion: new Date()
          };
        });

        console.log(`✅ Estado de tarjeta cambiado exitosamente:`, {
          tarjetaId,
          estadoAnterior: resultado.estado === nuevoEstado ? 'anterior' : resultado.estado,
          estadoNuevo: nuevoEstado
        });

        return {
          exito: true,
          mensaje: `Tarjeta ${nuevoEstado === 'bloqueada' ? 'bloqueada' : 'desbloqueada'} correctamente`,
          tarjeta: resultado
        };

      } catch (error) {
        console.error(`❌ Error al cambiar estado de tarjeta:`, error);
        return {
          exito: false,
          mensaje: error instanceof Error ? error.message : 'Error desconocido al cambiar estado',
          codigoError: 'CAMBIAR_ESTADO_ERROR',
          detallesError: error
        };
      }
    });
  }

  /**
   * Obtiene el historial de transacciones de una tarjeta
   * Utilizado para mostrar movimientos en el perfil y panel de admin
   * 
   * @param tarjetaId - ID de la tarjeta
   * @param limite - Número máximo de transacciones a obtener
   * @returns Promise con el array de transacciones
   */
  async obtenerHistorialTransacciones(tarjetaId: string, limite: number = 50): Promise<TransaccionTarjeta[]> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log(`📋 Obteniendo historial de transacciones para tarjeta: ${tarjetaId}`);
        console.log(`📋 Colección: ${this.COLECCION_TRANSACCIONES}`);

        const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
        
        // TEMPORAL: Consulta sin orderBy para evitar requerir índice
        // TODO: Crear índice compuesto en Firebase Console y restaurar orderBy
        const q = query(
          transaccionesCollection,
          where('tarjetaId', '==', tarjetaId),
          limit(limite)
        );

        console.log(`📋 Ejecutando consulta Firestore...`);
        const querySnapshot = await getDocs(q);
        console.log(`📋 Documentos encontrados: ${querySnapshot.size}`);
        
        const transacciones: TransaccionTarjeta[] = [];

        querySnapshot.forEach((doc) => {
          console.log(`📋 Procesando documento: ${doc.id}`, doc.data());
          const transaccion = { id: doc.id, ...doc.data() } as TransaccionTarjeta;
          
          // Convertir timestamp de Firestore a Date
          if (transaccion.fecha && typeof transaccion.fecha === 'object') {
            transaccion.fecha = (transaccion.fecha as any).toDate();
          }
          
          transacciones.push(transaccion);
        });

        // Ordenar manualmente por fecha (más reciente primero) ya que no podemos usar orderBy sin índice
        transacciones.sort((a, b) => {
          const fechaA = a.fecha instanceof Date ? a.fecha.getTime() : 0;
          const fechaB = b.fecha instanceof Date ? b.fecha.getTime() : 0;
          return fechaB - fechaA; // Orden descendente (más reciente primero)
        });

        console.log(`✅ Se obtuvieron ${transacciones.length} transacciones (ordenadas manualmente):`, transacciones);
        return transacciones;

      } catch (error) {
        console.error(`❌ Error al obtener historial de transacciones:`, error);
        throw new Error(`No se pudo obtener el historial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * FUNCIÓN DE DIAGNÓSTICO TEMPORAL - Listar todas las transacciones
   * Esta función es solo para debugging y debe ser removida en producción
   */
  async diagnosticarTransacciones(): Promise<void> {
    try {
      console.log(`🔍 DIAGNÓSTICO: Listando TODAS las transacciones en Firestore...`);
      
      const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
      const querySnapshot = await getDocs(transaccionesCollection);
      
      console.log(`🔍 DIAGNÓSTICO: Total de documentos en ${this.COLECCION_TRANSACCIONES}: ${querySnapshot.size}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`🔍 DIAGNÓSTICO: Documento ${doc.id}:`, {
          tarjetaId: data['tarjetaId'],
          usuarioId: data['usuarioId'],
          tipo: data['tipo'],
          monto: data['monto'],
          descripcion: data['descripcion'],
          fecha: data['fecha']
        });
      });
      
    } catch (error) {
      console.error(`🔍 DIAGNÓSTICO ERROR:`, error);
    }
  }

  /**
   * FUNCIÓN DE DIAGNÓSTICO TEMPORAL - Crear transacción de prueba
   * Esta función es solo para debugging y debe ser removida en producción
   */
  async crearTransaccionPrueba(tarjetaId: string, usuarioId: string): Promise<void> {
    try {
      console.log(`🧪 DIAGNÓSTICO: Creando transacción de prueba...`);
      
      const transaccionPrueba = {
        tarjetaId,
        usuarioId,
        tipo: 'pago' as TipoTransaccion,
        monto: -100,
        saldoAnterior: 1000,
        saldoNuevo: 900,
        descripcion: 'Transacción de prueba para diagnóstico',
        fecha: serverTimestamp(),
        claveIdempotencia: `prueba-${Date.now()}`
      };
      
      const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
      const docRef = await addDoc(transaccionesCollection, transaccionPrueba);
      
      console.log(`🧪 DIAGNÓSTICO: Transacción de prueba creada con ID: ${docRef.id}`);
      
    } catch (error) {
      console.error(`🧪 DIAGNÓSTICO ERROR al crear transacción de prueba:`, error);
    }
  }

  /**
   * Genera un número de tarjeta único de 16 dígitos
   * Utiliza el prefijo configurado y números aleatorios
   * 
   * @returns String con el número de tarjeta generado
   */
  private generarNumeroTarjeta(): string {
    const prefijo = CONFIGURACION_TARJETA_DEFAULT.PREFIJO_NUMERO;
    const longitudRestante = CONFIGURACION_TARJETA_DEFAULT.LONGITUD_NUMERO - prefijo.length;
    
    let numero = prefijo;
    for (let i = 0; i < longitudRestante; i++) {
      numero += Math.floor(Math.random() * 10).toString();
    }
    
    return numero;
  }

  /**
   * Genera una fecha de vencimiento ficticia
   * Añade los años de vigencia configurados a la fecha actual
   * 
   * @returns String con la fecha en formato MM/YY
   */
  private generarFechaVencimiento(): string {
    const fechaActual = new Date();
    const fechaVencimiento = new Date(
      fechaActual.getFullYear() + CONFIGURACION_TARJETA_DEFAULT.ANOS_VIGENCIA,
      fechaActual.getMonth(),
      1
    );
    
    const mes = (fechaVencimiento.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaVencimiento.getFullYear().toString().slice(-2);
    
    return `${mes}/${año}`;
  }

  /**
   * Genera un código CVV aleatorio
   * 
   * @returns String con el CVV de 3 dígitos
   */
  private generarCVV(): string {
    let cvv = '';
    for (let i = 0; i < CONFIGURACION_TARJETA_DEFAULT.LONGITUD_CVV; i++) {
      cvv += Math.floor(Math.random() * 10).toString();
    }
    return cvv;
  }

  /**
   * Enmascara un número de tarjeta para mostrar solo los últimos 4 dígitos
   * Utilizado para mostrar la tarjeta de forma segura en la UI
   * 
   * @param numero - Número completo de la tarjeta
   * @returns String con el número enmascarado
   */
  enmascararNumeroTarjeta(numero: string): string {
    if (!numero || numero.length < 4) return '****';
    
    const ultimosCuatro = numero.slice(-4);
    const asteriscos = '*'.repeat(numero.length - 4);
    
    // Formatear con espacios cada 4 dígitos
    const numeroFormateado = (asteriscos + ultimosCuatro).replace(/(.{4})/g, '$1 ').trim();
    return numeroFormateado;
  }

  /**
   * Valida que una clave de idempotencia no haya sido utilizada antes
   * Previene operaciones duplicadas
   * 
   * @param claveIdempotencia - Clave única de la operación
   * @throws Error si la clave ya fue utilizada
   */
  private async validarIdempotencia(claveIdempotencia: string): Promise<void> {
    const transaccionesCollection = collection(this.firestore, this.COLECCION_TRANSACCIONES);
    const q = query(transaccionesCollection, where('claveIdempotencia', '==', claveIdempotencia), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Esta operación ya fue procesada anteriormente');
    }
  }
}
