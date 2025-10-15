/**
 * MODELOS DE PEDIDOS - SISTEMA ALED2025
 * 
 * Define las interfaces y tipos para el sistema de gestión de pedidos
 * del e-commerce. Incluye pedidos, items, estados y operaciones relacionadas.
 */

// --- TIPOS Y ENUMS ---

/**
 * Estados posibles de un pedido
 */
export type EstadoPedido = 
  | 'creado'           // Pedido creado pero no pagado
  | 'pendiente'        // Pago iniciado pero no confirmado
  | 'pagado'           // Pago confirmado
  | 'preparando'       // En preparación/empaque
  | 'enviado'          // Enviado al cliente
  | 'entregado'        // Entregado exitosamente
  | 'cancelado'        // Cancelado por el cliente o sistema
  | 'rechazado'        // Pago rechazado
  | 'reembolsado';     // Pedido reembolsado

/**
 * Métodos de pago disponibles
 */
export type MetodoPago = 
  | 'tarjeta_virtual'  // Tarjeta virtual del sistema
  | 'mercado_pago'     // Mercado Pago
  | 'transferencia'    // Transferencia bancaria
  | 'efectivo';        // Pago en efectivo

/**
 * Tipos de descuento aplicables
 */
export type TipoDescuento = 
  | 'porcentaje'       // Descuento por porcentaje
  | 'monto_fijo'       // Descuento por monto fijo
  | 'envio_gratis';    // Envío gratuito

// --- INTERFACES PRINCIPALES ---

/**
 * Interfaz para items individuales dentro de un pedido
 */
export interface ItemPedido {
  /** ID único del item en el pedido */
  id: string;
  
  /** ID del producto en el catálogo */
  productoId: string;
  
  /** Nombre del producto al momento de la compra */
  nombre: string;
  
  /** Descripción del producto */
  descripcion?: string;
  
  /** URL de la imagen del producto */
  imagen?: string;
  
  /** Precio unitario al momento de la compra */
  precioUnitario: number;
  
  /** Cantidad solicitada */
  cantidad: number;
  
  /** Subtotal del item (precioUnitario * cantidad) */
  subtotal: number;
  
  /** Descuentos aplicados a este item */
  descuentos?: DescuentoItem[];
  
  /** Metadatos adicionales del producto */
  metadata?: {
    categoria?: string;
    marca?: string;
    modelo?: string;
    [key: string]: any;
  };
}

/**
 * Interfaz para descuentos aplicados a items
 */
export interface DescuentoItem {
  /** ID único del descuento */
  id: string;
  
  /** Nombre del descuento */
  nombre: string;
  
  /** Tipo de descuento */
  tipo: TipoDescuento;
  
  /** Valor del descuento */
  valor: number;
  
  /** Monto descontado */
  montoDescontado: number;
}

/**
 * Interfaz para información de envío
 */
export interface InformacionEnvio {
  /** Dirección completa de entrega */
  direccion: string;
  
  /** Ciudad de entrega */
  ciudad: string;
  
  /** Código postal */
  codigoPostal: string;
  
  /** Provincia/Estado */
  provincia: string;
  
  /** País */
  pais: string;
  
  /** Instrucciones especiales de entrega */
  instrucciones?: string;
  
  /** Costo del envío */
  costoEnvio: number;
  
  /** Método de envío seleccionado */
  metodoEnvio: string;
  
  /** Tiempo estimado de entrega */
  tiempoEstimado?: string;
  
  /** Número de seguimiento */
  numeroSeguimiento?: string;
}

/**
 * Interfaz para información de pago
 */
export interface InformacionPago {
  /** Método de pago utilizado */
  metodoPago: MetodoPago;
  
  /** ID de la transacción de pago */
  transaccionId?: string;
  
  /** ID del pago en el proveedor externo (ej: Mercado Pago) */
  pagoExternoId?: string;
  
  /** Estado del pago */
  estadoPago: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  
  /** Monto total pagado */
  montoPagado: number;
  
  /** Moneda del pago */
  moneda: string;
  
  /** Fecha de pago */
  fechaPago?: Date;
  
  /** Detalles adicionales del pago */
  detallesPago?: {
    ultimosDigitos?: string;
    tipoTarjeta?: string;
    banco?: string;
    [key: string]: any;
  };
  
  /** Motivo de rechazo (si aplica) */
  motivoRechazo?: string;
}

/**
 * Interfaz principal para pedidos
 */
export interface Pedido {
  /** ID único del pedido */
  id?: string;
  
  /** Número de pedido legible para el usuario */
  numeroPedido: string;
  
  /** ID del usuario que realizó el pedido */
  usuarioId: string;
  
  /** Información del cliente */
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    documento?: string;
  };
  
  /** Estado actual del pedido */
  estado: EstadoPedido;
  
  /** Items del pedido */
  items: ItemPedido[];
  
  /** Información de envío */
  envio: InformacionEnvio;
  
  /** Información de pago */
  pago: InformacionPago;
  
  /** Subtotal (suma de items sin descuentos ni envío) */
  subtotal: number;
  
  /** Total de descuentos aplicados */
  totalDescuentos: number;
  
  /** Costo de envío */
  costoEnvio: number;
  
  /** Total final del pedido */
  total: number;
  
  /** Notas adicionales del pedido */
  notas?: string;
  
  /** Fecha de creación del pedido */
  fechaCreacion: Date;
  
  /** Fecha de última actualización */
  fechaActualizacion: Date;
  
  /** Fecha de entrega estimada */
  fechaEntregaEstimada?: Date;
  
  /** Fecha de entrega real */
  fechaEntregaReal?: Date;
  
  /** Historial de cambios de estado */
  historialEstados: CambioEstado[];
  
  /** Metadatos adicionales */
  metadata?: {
    origen?: string;           // web, mobile, admin
    promociones?: string[];    // IDs de promociones aplicadas
    cuponDescuento?: string;   // Código de cupón usado
    [key: string]: any;
  };
}

/**
 * Interfaz para registrar cambios de estado del pedido
 */
export interface CambioEstado {
  /** Estado anterior */
  estadoAnterior?: EstadoPedido;
  
  /** Nuevo estado */
  estadoNuevo: EstadoPedido;
  
  /** Fecha del cambio */
  fecha: Date;
  
  /** Motivo del cambio */
  motivo?: string;
  
  /** Usuario que realizó el cambio (si es manual) */
  usuarioId?: string;
  
  /** Notas adicionales */
  notas?: string;
}

/**
 * Interfaz para solicitudes de creación de pedido
 */
export interface SolicitudCrearPedido {
  /** Items del carrito */
  items: Omit<ItemPedido, 'id' | 'subtotal'>[];
  
  /** Información de envío */
  envio: Omit<InformacionEnvio, 'costoEnvio'>;
  
  /** Método de pago seleccionado */
  metodoPago: MetodoPago;
  
  /** Notas del pedido */
  notas?: string;
  
  /** Código de cupón de descuento */
  cuponDescuento?: string;
}

/**
 * Interfaz para respuestas de operaciones con pedidos
 */
export interface RespuestaApiPedido {
  /** Indica si la operación fue exitosa */
  exito: boolean;
  
  /** Mensaje descriptivo del resultado */
  mensaje: string;
  
  /** Pedido resultante (si aplica) */
  pedido?: Pedido;
  
  /** Lista de pedidos (para consultas múltiples) */
  pedidos?: Pedido[];
  
  /** Código de error (si aplica) */
  codigoError?: string;
  
  /** Detalles adicionales del error */
  detallesError?: any;
}

/**
 * Interfaz para estadísticas de pedidos
 */
export interface EstadisticasPedidos {
  /** Total de pedidos */
  totalPedidos: number;
  
  /** Pedidos por estado */
  porEstado: {
    [K in EstadoPedido]: number;
  };
  
  /** Total facturado */
  totalFacturado: number;
  
  /** Promedio de valor por pedido */
  valorPromedio: number;
  
  /** Productos más vendidos */
  productosMasVendidos: {
    productoId: string;
    nombre: string;
    cantidadVendida: number;
    ingresoTotal: number;
  }[];
  
  /** Métodos de pago más utilizados */
  metodosPagoPopulares: {
    metodo: MetodoPago;
    cantidad: number;
    porcentaje: number;
  }[];
}

// --- CONSTANTES Y CONFIGURACIÓN ---

/**
 * Configuración por defecto para pedidos
 */
export const CONFIGURACION_PEDIDOS_DEFAULT = {
  /** Tiempo límite para confirmar pago (en minutos) */
  TIEMPO_LIMITE_PAGO: 30,
  
  /** Costo de envío por defecto */
  COSTO_ENVIO_DEFAULT: 2500,
  
  /** Monto mínimo para envío gratis */
  MONTO_ENVIO_GRATIS: 50000,
  
  /** Prefijo para números de pedido */
  PREFIJO_NUMERO_PEDIDO: 'ALED',
  
  /** Estados que permiten cancelación */
  ESTADOS_CANCELABLES: ['creado', 'pendiente', 'pagado'],
  
  /** Estados que permiten reembolso */
  ESTADOS_REEMBOLSABLES: ['pagado', 'preparando', 'enviado'],
  
  /** Moneda por defecto */
  MONEDA_DEFAULT: 'ARS'
} as const;
