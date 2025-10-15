/**
 * MODELOS DE TARJETA VIRTUAL
 * 
 * Este archivo define todas las interfaces y tipos necesarios para el sistema
 * de tarjetas virtuales de prueba. Incluye modelos para tarjetas, transacciones,
 * pagos y operaciones administrativas.
 * 
 * Dependencias:
 * - Ninguna (solo tipos TypeScript)
 * 
 * Flujo general:
 * 1. TarjetaVirtual: Representa la tarjeta asignada a cada usuario
 * 2. TransaccionTarjeta: Registra todos los movimientos de saldo
 * 3. PagoVirtual: Maneja los intentos y estados de pago
 * 4. OperacionAdmin: Registra acciones administrativas
 */

/**
 * Estados posibles de una tarjeta virtual
 */
export type EstadoTarjeta = 'activa' | 'bloqueada' | 'suspendida';

/**
 * Tipos de transacciones que puede realizar una tarjeta
 */
export type TipoTransaccion = 
  | 'recarga'           // Aumento de saldo por admin
  | 'descuento'         // Reducción de saldo por admin
  | 'pago'              // Pago realizado por el usuario
  | 'reembolso'         // Devolución de dinero
  | 'bloqueo'           // Bloqueo de tarjeta
  | 'desbloqueo';       // Desbloqueo de tarjeta

/**
 * Estados de un pago virtual
 */
export type EstadoPago = 
  | 'pendiente'         // Intento creado, esperando autorización
  | 'autorizado'        // Pago autorizado, esperando confirmación
  | 'confirmado'        // Pago completado y saldo descontado
  | 'anulado'           // Pago cancelado antes de confirmarse
  | 'reembolsado'       // Pago revertido después de confirmarse
  | 'rechazado';        // Pago rechazado por saldo insuficiente o tarjeta bloqueada

/**
 * Interfaz principal para una tarjeta virtual
 * Cada usuario registrado recibe automáticamente una tarjeta
 */
export interface TarjetaVirtual {
  /** ID único de la tarjeta (generado por Firestore) */
  id?: string;
  
  /** ID del usuario propietario de la tarjeta */
  usuarioId: string;
  
  /** Número de tarjeta (16 dígitos generados aleatoriamente) */
  numero: string;
  
  /** Nombre del titular (nombre + apellido del usuario) */
  titular: string;
  
  /** Fecha de vencimiento ficticia (formato MM/YY) */
  fechaVencimiento: string;
  
  /** Código CVV ficticio (3 dígitos) */
  cvv: string;
  
  /** Saldo actual disponible en la tarjeta */
  saldo: number;
  
  /** Estado actual de la tarjeta */
  estado: EstadoTarjeta;
  
  /** Fecha de creación de la tarjeta */
  fechaCreacion: Date;
  
  /** Fecha de última actualización */
  fechaActualizacion: Date;
  
  /** Límite máximo de saldo permitido */
  limiteMaximo: number;
  
  /** Indica si la tarjeta está habilitada para pagos online */
  habilitadaOnline: boolean;
  
  /** Tipo de tarjeta (Visa, Mastercard, etc.) */
  tipoTarjeta?: string;
  
  /** Nombre del banco emisor */
  nombreBanco?: string;
  
  /** Logo del banco/tarjeta en formato base64 */
  logoBase64?: string;
}

/**
 * Interfaz para registrar todas las transacciones de una tarjeta
 * Mantiene un historial completo para auditoría
 */
export interface TransaccionTarjeta {
  /** ID único de la transacción */
  id?: string;
  
  /** ID de la tarjeta involucrada */
  tarjetaId: string;
  
  /** ID del usuario propietario */
  usuarioId: string;
  
  /** Tipo de transacción realizada */
  tipo: TipoTransaccion;
  
  /** Monto de la transacción (positivo para ingresos, negativo para egresos) */
  monto: number;
  
  /** Saldo anterior antes de la transacción */
  saldoAnterior: number;
  
  /** Saldo resultante después de la transacción */
  saldoNuevo: number;
  
  /** Descripción detallada de la transacción */
  descripcion: string;
  
  /** Fecha y hora de la transacción */
  fecha: Date;
  
  /** ID del administrador que realizó la operación (si aplica) */
  adminId?: string;
  
  /** ID del pago asociado (si la transacción es por un pago) */
  pagoId?: string;
  
  /** Clave de idempotencia para evitar transacciones duplicadas */
  claveIdempotencia: string;
  
  /** Metadatos adicionales de la transacción */
  metadata?: {
    ip?: string;
    userAgent?: string;
    ubicacion?: string;
  };
}

/**
 * Interfaz para manejar pagos virtuales
 * Simula el flujo completo de Mercado Pago
 */
export interface PagoVirtual {
  /** ID único del pago */
  id?: string;
  
  /** ID de la tarjeta utilizada para el pago */
  tarjetaId: string;
  
  /** ID del usuario que realiza el pago */
  usuarioId: string;
  
  /** Monto total del pago */
  monto: number;
  
  /** Descripción del pago o producto */
  descripcion: string;
  
  /** Estado actual del pago */
  estado: EstadoPago;
  
  /** Fecha de creación del intento de pago */
  fechaCreacion: Date;
  
  /** Fecha de autorización (si aplica) */
  fechaAutorizacion?: Date;
  
  /** Fecha de confirmación (si aplica) */
  fechaConfirmacion?: Date;
  
  /** Fecha de anulación o reembolso (si aplica) */
  fechaAnulacion?: Date;
  
  /** Clave de idempotencia para evitar pagos duplicados */
  claveIdempotencia: string;
  
  /** Referencia externa del comercio o sistema */
  referenciaExterna?: string;
  
  /** Información del producto o servicio */
  detalleProducto?: {
    nombre: string;
    categoria: string;
    cantidad: number;
    precioUnitario: number;
  };
  
  /** Motivo de rechazo, anulación o reembolso */
  motivoRechazo?: string;
  
  /** ID de la transacción asociada en el historial */
  transaccionId?: string;
}

/**
 * Interfaz para registrar operaciones administrativas
 * Mantiene un log de todas las acciones del administrador
 */
export interface OperacionAdmin {
  /** ID único de la operación */
  id?: string;
  
  /** ID del administrador que realizó la operación */
  adminId: string;
  
  /** Nombre del administrador */
  adminNombre: string;
  
  /** ID de la tarjeta afectada */
  tarjetaId: string;
  
  /** ID del usuario propietario de la tarjeta */
  usuarioId: string;
  
  /** Tipo de operación realizada */
  tipoOperacion: 'modificar_saldo' | 'bloquear_tarjeta' | 'desbloquear_tarjeta' | 'consultar_historial';
  
  /** Descripción detallada de la operación */
  descripcion: string;
  
  /** Valores anteriores (para operaciones de modificación) */
  valoresAnteriores?: {
    saldo?: number;
    estado?: EstadoTarjeta;
  };
  
  /** Valores nuevos (para operaciones de modificación) */
  valoresNuevos?: {
    saldo?: number;
    estado?: EstadoTarjeta;
  };
  
  /** Fecha y hora de la operación */
  fecha: Date;
  
  /** Dirección IP desde donde se realizó la operación */
  ip?: string;
  
  /** Justificación o motivo de la operación */
  justificacion?: string;
}

/**
 * Interfaz para las respuestas de la API de tarjetas virtuales
 */
export interface RespuestaApiTarjeta {
  /** Indica si la operación fue exitosa */
  exito: boolean;
  
  /** Mensaje descriptivo del resultado */
  mensaje: string;
  
  /** Datos de la tarjeta (si aplica) */
  tarjeta?: TarjetaVirtual;
  
  /** Datos del pago (si aplica) */
  pago?: PagoVirtual;
  
  /** Lista de transacciones (si aplica) */
  transacciones?: TransaccionTarjeta[];
  
  /** Código de error (si aplica) */
  codigoError?: string;
  
  /** Detalles adicionales del error */
  detallesError?: any;
}

/**
 * Interfaz para solicitudes de modificación de saldo
 */
export interface SolicitudModificarSaldo {
  /** ID de la tarjeta a modificar */
  tarjetaId: string;
  
  /** Monto a agregar o quitar (positivo para agregar, negativo para quitar) */
  monto: number;
  
  /** Descripción de la operación */
  descripcion: string;
  
  /** Justificación de la modificación */
  justificacion?: string;
  
  /** Clave de idempotencia */
  claveIdempotencia: string;
}

/**
 * Interfaz para solicitudes de creación de pago
 */
export interface SolicitudCrearPago {
  /** ID de la tarjeta a utilizar */
  tarjetaId: string;
  
  /** Monto del pago */
  monto: number;
  
  /** Descripción del pago */
  descripcion: string;
  
  /** Referencia externa del comercio */
  referenciaExterna?: string;
  
  /** Detalles del producto o servicio */
  detalleProducto?: {
    nombre: string;
    categoria: string;
    cantidad: number;
    precioUnitario: number;
  };
  
  /** Clave de idempotencia */
  claveIdempotencia: string;
}

/**
 * Interfaz para la configuración de personalización de tarjetas virtuales
 */
export interface ConfiguracionTarjetaPersonalizada {
  /** ID de la configuración */
  id?: string;
  
  /** Tipo de tarjeta por defecto (Visa, Mastercard, etc.) */
  tipoTarjetaDefault: string;
  
  /** Nombre del banco emisor */
  nombreBanco: string;
  
  /** Logo del banco/tarjeta en formato base64 */
  logoBase64: string;
  
  /** Prefijo para números de tarjeta */
  prefijoNumero: string;
  
  /** Color primario de la tarjeta (hex) */
  colorPrimario: string;
  
  /** Color secundario de la tarjeta (hex) */
  colorSecundario: string;
  
  /** Fecha de última actualización */
  fechaActualizacion: Date;
  
  /** ID del administrador que realizó la última modificación */
  adminId: string;
}

/**
 * Configuración por defecto para nuevas tarjetas virtuales
 */
export const CONFIGURACION_TARJETA_DEFAULT = {
  /** Saldo inicial para nuevas tarjetas */
  SALDO_INICIAL: 1000,
  
  /** Límite máximo de saldo */
  LIMITE_MAXIMO: 50000,
  
  /** Estado inicial de las tarjetas */
  ESTADO_INICIAL: 'activa' as EstadoTarjeta,
  
  /** Años de vigencia de la tarjeta */
  ANOS_VIGENCIA: 5,
  
  /** Prefijo para números de tarjeta (simula una entidad específica) */
  PREFIJO_NUMERO: '4532',
  
  /** Longitud total del número de tarjeta */
  LONGITUD_NUMERO: 16,
  
  /** Longitud del código CVV */
  LONGITUD_CVV: 3,
  
  /** Tipo de tarjeta por defecto */
  TIPO_TARJETA_DEFAULT: 'Visa',
  
  /** Nombre del banco por defecto */
  NOMBRE_BANCO_DEFAULT: 'Banco Virtual',
  
  /** Colores por defecto */
  COLOR_PRIMARIO_DEFAULT: '#3b82f6',
  COLOR_SECUNDARIO_DEFAULT: '#1e40af'
};
