/**
 * ============================================================================
 * FUNCIONES DE FIREBASE - BACKEND DEL PROYECTO
 * ============================================================================
 * 
 * Este archivo contiene las Cloud Functions de Firebase que actúan como
 * backend de nuestra aplicación de e-commerce. Incluye:
 * 
 * 1. Integración con Mercado Pago para procesar pagos
 * 2. Creación de preferencias de pago
 * 3. Recepción y validación de webhooks de Mercado Pago
 * 
 * Tecnologías utilizadas:
 * - Firebase Cloud Functions (Serverless)
 * - Firebase Admin SDK
 * - Mercado Pago SDK
 * - TypeScript
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * Profesor: Sebastian Saldivar
 * ============================================================================
 */

// Importación de módulos necesarios
import * as functions from 'firebase-functions/v1'; // SDK de Firebase Functions
import * as admin from 'firebase-admin'; // SDK de Firebase Admin para acceder a Firestore
// @ts-ignore - Ignoramos el error de TypeScript para el SDK de Mercado Pago
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'; // SDK de Mercado Pago
import * as crypto from 'crypto'; // Módulo de Node.js para validación de firmas

// Inicializa la aplicación de Firebase Admin
// Esto nos permite interactuar con los servicios de Firebase (Firestore, Auth, etc.)
admin.initializeApp();

// --- CONFIGURACIÓN DE MERCADO PAGO ---
// Creamos un cliente de Mercado Pago con nuestras credenciales
// Las credenciales se almacenan de forma segura en Firebase Config
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.accesstoken, // Token de acceso de Mercado Pago
});

// Clave secreta para validar webhooks de Mercado Pago
// Esto asegura que las notificaciones realmente provienen de Mercado Pago
const webhookSecret = functions.config().mercadopago.secretkey;

/**
 * ============================================================================
 * FUNCIÓN: createPreferenceV1
 * ============================================================================
 * 
 * Esta función crea una preferencia de pago en Mercado Pago.
 * Una "preferencia" es un objeto que contiene toda la información del pago:
 * - Productos a comprar
 * - Precios y cantidades
 * - URLs de retorno (éxito, error, pendiente)
 * 
 * Flujo:
 * 1. El frontend envía los items del carrito
 * 2. Esta función valida los datos
 * 3. Crea la preferencia en Mercado Pago
 * 4. Devuelve el ID de la preferencia
 * 5. El frontend redirige al usuario a Mercado Pago con ese ID
 * 
 * @param request - Solicitud HTTP con los items del carrito
 * @param response - Respuesta HTTP con el ID de la preferencia
 */
export const createPreferenceV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
  
  // --- CONFIGURACIÓN DE CORS (Cross-Origin Resource Sharing) ---
  // CORS permite que nuestro frontend (en un dominio diferente) pueda
  // hacer peticiones a esta función de Firebase
  const allowedOrigins = [
    // Orígenes de desarrollo local
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:4202',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4201',
    'http://127.0.0.1:4202',
    // Orígenes de producción
    'https://aled-2025.vercel.app',
    'https://aled3-6b4ee.web.app'
  ];
  
  // Obtenemos el origen de la petición
  const origin = request.headers.origin as string;
  
  // Si el origen está en nuestra lista de permitidos, lo autorizamos
  if (origin && allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  
  // Configuramos los métodos HTTP permitidos
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Configuramos los headers permitidos
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Permitimos el envío de credenciales (cookies, headers de autenticación)
  response.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight request (petición OPTIONS que hace el navegador antes de POST)
  // El navegador hace esta petición automáticamente para verificar permisos CORS
  if (request.method === 'OPTIONS') {
    response.status(204).send(''); // Respondemos con éxito sin contenido
    return;
  }

  try {
    // --- OBTENCIÓN Y VALIDACIÓN DE DATOS ---
    // Extraemos los items del carrito que envió el frontend
    const items = request.body.items;

    // VALIDACIÓN 1: Verificamos que se hayan enviado items
    // Debe ser un array y no puede estar vacío
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Error de validación: el array de items está vacío o no existe');
      response.status(400).json({ error: "Solicitud incorrecta: el array 'items' está vacío o no existe." });
      return;
    }

    // VALIDACIÓN 2: Verificamos la estructura de cada item del carrito
    // Cada item debe tener un producto y una cantidad válidos
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Verificamos que el item tenga producto y cantidad
      if (!item.producto || !item.cantidad) {
        console.error(`Error de validación: Item ${i} no tiene producto o cantidad`, item);
        response.status(400).json({ error: `Item ${i} no tiene los campos requeridos` });
        return;
      }
      
      // Verificamos que el producto tenga todos los campos necesarios
      // id: identificador único del producto
      // nombre: nombre del producto para mostrar en Mercado Pago
      // precio: debe ser un número válido
      if (!item.producto.id || !item.producto.nombre || typeof item.producto.precio !== 'number') {
        console.error(`Error de validación: Item ${i} el producto no tiene los campos requeridos`, item.producto);
        response.status(400).json({ error: `Item ${i} el producto no tiene los campos requeridos` });
        return;
      }
      
      // Verificamos que la cantidad sea un número positivo
      if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        console.error(`Error de validación: Item ${i} cantidad inválida`, item.cantidad);
        response.status(400).json({ error: `Item ${i} tiene una cantidad inválida` });
        return;
      }
    }

    // Log para debugging: mostramos los items que vamos a procesar
    console.log('Creando preferencia para items:', JSON.stringify(items, null, 2));

    // --- CREACIÓN DE LA PREFERENCIA DE PAGO EN MERCADO PAGO ---
    // Instanciamos el objeto Preference del SDK de Mercado Pago
    const preference = new Preference(client);
    
    // Preparamos los datos en el formato que Mercado Pago requiere
    const preferenceData = {
      // Transformamos los items del carrito al formato de Mercado Pago
      items: items.map((item: any) => ({
        id: String(item.producto.id),           // ID del producto (debe ser string)
        title: item.producto.nombre,            // Nombre que se mostrará en Mercado Pago
        quantity: Number(item.cantidad),        // Cantidad de unidades
        unit_price: Number(item.producto.precio), // Precio por unidad
        currency_id: 'ARS',                     // Moneda: Pesos Argentinos
      })),
      
      // URLs de retorno: Mercado Pago redirigirá al usuario a estas URLs
      // según el resultado del pago
      back_urls: {
        success: 'https://aled3-6b4ee.web.app/pago-exitoso',  // Pago aprobado
        failure: 'https://aled3-6b4ee.web.app/pago-fallido',  // Pago rechazado
        pending: 'https://aled3-6b4ee.web.app/pago-pendiente' // Pago pendiente
      }
    };

    // Log para debugging: mostramos la preferencia que vamos a crear
    console.log('Datos de preferencia:', JSON.stringify(preferenceData, null, 2));

    // Creamos la preferencia en Mercado Pago
    // Esta llamada hace una petición HTTP a la API de Mercado Pago
    const result = await preference.create({
      body: preferenceData,
    });

    // Log de éxito
    console.log('Preferencia creada exitosamente:', result.id);
    
    // Devolvemos el ID de la preferencia al frontend
    // El frontend usará este ID para redirigir al usuario a Mercado Pago
    response.status(200).json({ id: result.id });
  } catch (error: any) {
    // --- MANEJO DE ERRORES ---
    // Si algo sale mal, capturamos el error y lo registramos detalladamente
    
    console.error('Error al crear la preferencia de pago:', error);
    console.error('Mensaje de error:', error.message);
    console.error('Stack del error:', error.stack);

    // La SDK de Mercado Pago puede devolver información adicional en 'error.cause'
    if (error.cause) {
      console.error('Causa detallada:', JSON.stringify(error.cause, null, 2));
    }

    // Si es un error de la API de Mercado Pago, registramos la respuesta
    if (error.response) {
      console.error('Estado de respuesta:', error.response.status);
      console.error('Datos de respuesta:', JSON.stringify(error.response.data, null, 2));
    }

    // Devolvemos un error 500 (Internal Server Error) al frontend
    response.status(500).json({ 
      error: 'Error al crear la preferencia de pago.',
      detalles: error.message 
    });
  }
});

/**
 * ============================================================================
 * FUNCIÓN: receiveWebhookV1
 * ============================================================================
 * 
 * Esta función recibe notificaciones (webhooks) de Mercado Pago cuando
 * ocurre un evento relacionado con un pago (aprobado, rechazado, etc.)
 * 
 * Los webhooks son peticiones HTTP que Mercado Pago hace a nuestro servidor
 * para notificarnos sobre cambios en el estado de los pagos.
 * 
 * Flujo:
 * 1. Usuario completa el pago en Mercado Pago
 * 2. Mercado Pago envía una notificación a esta función
 * 3. Validamos que la notificación sea legítima (firma HMAC)
 * 4. Obtenemos los detalles del pago
 * 5. Ejecutamos lógica de negocio (actualizar stock, crear pedido, etc.)
 * 
 * @param request - Solicitud HTTP con la notificación de Mercado Pago
 * @param response - Respuesta HTTP
 */
export const receiveWebhookV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
  
  // --- CONFIGURACIÓN DE CORS ---
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:4202',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4201',
    'http://127.0.0.1:4202',
    'https://aled-2025.vercel.app',
    'https://aled3-6b4ee.web.app'
  ];
  const origin = request.headers.origin as string;
  if (origin && allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Incluimos x-signature y x-request-id que son headers específicos de Mercado Pago
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-request-id');
  response.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight request
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // --- EXTRACCIÓN DE HEADERS DE SEGURIDAD ---
  // Mercado Pago envía estos headers para validar la autenticidad de la petición
  const signature = request.headers['x-signature'] as string;
  const requestId = request.headers['x-request-id'] as string;

  // --- VALIDACIÓN DE FIRMA (HMAC-SHA256) ---
  // Esto es CRÍTICO para la seguridad: asegura que la petición realmente viene de Mercado Pago
  // y no es un intento de ataque o fraude
  
  // La firma viene en formato: "ts=timestamp,v1=hash"
  const [ts, hash] = signature.split(',');
  const timestamp = ts.split('=')[1];      // Extraemos el timestamp
  const receivedHash = hash.split('=')[1]; // Extraemos el hash recibido

  // Creamos el "manifest" (mensaje que se firmó)
  // Debe seguir exactamente este formato para que coincida
  const manifest = `id:${request.body.data.id};request-id:${requestId};ts:${timestamp};`;
  
  // Calculamos el hash HMAC-SHA256 usando nuestra clave secreta
  const hmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(manifest)
    .digest('hex');

  // Comparamos el hash calculado con el hash recibido
  if (hmac !== receivedHash) {
    // Si no coinciden, la petición no es legítima
    console.warn('Firma de Webhook inválida. Posible intento de fraude.');
    response.status(403).send('Prohibido - Firma inválida');
    return;
  }

  // --- PROCESAMIENTO DE LA NOTIFICACIÓN ---
  // Solo procesamos notificaciones de tipo "payment"
  if (request.body.type === 'payment') {
    try {
      // Obtenemos el ID del pago desde el body de la notificación
      const paymentId = request.body.data.id;
      
      // Consultamos los detalles completos del pago en Mercado Pago
      // Esto nos da información actualizada y confiable
      const payment = await new Payment(client).get({ id: paymentId });

      // Verificamos el estado del pago
      if (payment.status === 'approved') {
        // ✅ PAGO APROBADO
        console.log(`✅ Pago aprobado: ${paymentId}`);
        console.log('Detalles del pago:', JSON.stringify({
          id: payment.id,
          status: payment.status,
          transaction_amount: payment.transaction_amount,
          currency_id: payment.currency_id,
          payer: payment.payer,
          payment_method_id: payment.payment_method_id,
          date_created: payment.date_created,
          date_approved: payment.date_approved
        }, null, 2));
        
        try {
          // 1. CREAR REGISTRO DEL PEDIDO EN FIRESTORE
          await crearPedido(payment);
          console.log('✅ Pedido creado exitosamente en Firestore');
          
          // 2. ACTUALIZAR STOCK DE PRODUCTOS
          if (payment.additional_info?.items && payment.additional_info.items.length > 0) {
            await actualizarStock(payment.additional_info.items);
            console.log('✅ Stock actualizado exitosamente');
          } else {
            console.warn('⚠️ No se encontraron items en el pago para actualizar stock');
          }
          
          // 3. REGISTRAR TRANSACCIÓN EXITOSA
          await registrarTransaccion(payment, 'success');
          console.log('✅ Transacción registrada exitosamente');
          
        } catch (error) {
          console.error('❌ Error procesando pago aprobado:', error);
          // Registrar el error pero no fallar el webhook
          await registrarTransaccion(payment, 'error', error);
        }
        
      } else if (payment.status === 'pending') {
        // ⏳ PAGO PENDIENTE
        console.log(`⏳ Pago pendiente: ${paymentId} - Motivo: ${payment.status_detail}`);
        await registrarTransaccion(payment, 'pending');
        
      } else if (payment.status === 'rejected') {
        // ❌ PAGO RECHAZADO
        console.log(`❌ Pago rechazado: ${paymentId} - Motivo: ${payment.status_detail}`);
        await registrarTransaccion(payment, 'rejected');
        
      } else if (payment.status === 'refunded') {
        // 💰 PAGO REEMBOLSADO
        console.log(`💰 Pago reembolsado: ${paymentId}`);
        // Aquí podrías restaurar el stock si es necesario
        await registrarTransaccion(payment, 'refunded');
        
      } else {
        // ❓ ESTADO DESCONOCIDO
        console.log(`❓ Estado desconocido del pago: ${payment.status} (ID: ${paymentId})`);
        await registrarTransaccion(payment, 'unknown');
      }
      
      // Respondemos con éxito a Mercado Pago
      // Es importante responder rápido (< 5 segundos) para que no reintente
      response.status(200).send('Webhook recibido exitosamente.');
      
    } catch (error) {
      // Error al procesar el webhook
      console.error('Error procesando webhook:', error);
      response.status(500).send('Error procesando webhook.');
    }
  } else {
    // No es una notificación de pago, la ignoramos
    // Mercado Pago puede enviar otros tipos de notificaciones
    response.status(200).send('No es una notificación de pago, omitiendo.');
  }
});

/**
 * ============================================================================
 * FUNCIONES AUXILIARES PARA PROCESAMIENTO DE PAGOS
 * ============================================================================
 */

/**
 * Interfaz que define la estructura completa de un pedido en el sistema
 * 
 * Esta interfaz establece todos los campos que debe tener un pedido
 * cuando se almacena en Firestore después de un pago exitoso.
 */
interface Pedido {
  id: string;                    // ID único del pedido (ej: "pedido_123456789")
  paymentId: string;             // ID del pago en Mercado Pago
  estado: 'completado' | 'pendiente' | 'rechazado' | 'reembolsado'; // Estado actual del pedido
  total: number;                 // Monto total del pedido
  moneda: string;                // Moneda utilizada (ej: "ARS")
  metodoPago: string;            // Método de pago usado (ej: "visa", "mastercard")
  items: Array<{                 // Array de productos comprados
    id: string;                  // ID del producto
    nombre: string;              // Nombre del producto
    cantidad: number;            // Cantidad comprada
    precio: number;              // Precio unitario
    subtotal: number;            // Precio * cantidad
  }>;
  cliente: {                     // Información del cliente
    email?: string;              // Email del cliente
    nombre?: string;             // Nombre del cliente
    apellido?: string;           // Apellido del cliente
    telefono?: string;           // Teléfono del cliente
  };
  fechaCreacion: Date;           // Fecha cuando se creó el pedido
  fechaAprobacion?: Date;        // Fecha cuando se aprobó el pago
  detallesPago: any;             // Detalles completos del pago de Mercado Pago
}

/**
 * Interfaz para registrar todas las transacciones del sistema
 * 
 * Esta interfaz define la estructura para el log de auditoría
 * que registra TODAS las transacciones, exitosas o fallidas.
 */
interface Transaccion {
  paymentId: string;             // ID del pago en Mercado Pago
  estado: 'success' | 'pending' | 'rejected' | 'refunded' | 'error' | 'unknown'; // Estado de la transacción
  fecha: Date;                   // Fecha y hora de la transacción
  detalles: any;                 // Detalles del pago de Mercado Pago
  error?: any;                   // Información del error (si existe)
}

/**
 * ============================================================================
 * FUNCIÓN: crearPedido
 * ============================================================================
 * 
 * Crea un registro completo del pedido en Firestore cuando un pago es aprobado.
 * 
 * Esta función toma toda la información del pago de Mercado Pago y la convierte
 * en un pedido estructurado que se guarda en nuestra base de datos.
 * 
 * @param payment - Objeto completo del pago recibido de Mercado Pago
 * @returns Promise<void> - No retorna nada, pero puede lanzar errores
 */
async function crearPedido(payment: any): Promise<void> {
  try {
    // Obtenemos la instancia de Firestore para interactuar con la base de datos
    const firestore = admin.firestore();
    
    // --- PREPARACIÓN DE LOS ITEMS DEL PEDIDO ---
    // Convertimos los items de Mercado Pago al formato de nuestro sistema
    const items = payment.additional_info?.items?.map((item: any) => ({
      id: item.id,                                    // ID del producto
      nombre: item.title,                             // Nombre del producto
      cantidad: item.quantity,                        // Cantidad comprada
      precio: item.unit_price,                        // Precio unitario
      subtotal: item.quantity * item.unit_price       // Cálculo del subtotal
    })) || []; // Si no hay items, usamos un array vacío

    // --- CREACIÓN DEL OBJETO PEDIDO ---
    // Estructuramos toda la información del pago en un pedido completo
    const pedido: Pedido = {
      id: `pedido_${payment.id}`,                    // ID único del pedido
      paymentId: payment.id.toString(),              // ID del pago en Mercado Pago
      estado: 'completado',                          // Estado del pedido (completado porque el pago fue aprobado)
      total: payment.transaction_amount,             // Monto total del pedido
      moneda: payment.currency_id,                   // Moneda utilizada (ARS, USD, etc.)
      metodoPago: payment.payment_method_id,         // Método de pago usado (visa, mastercard, etc.)
      items: items,                                  // Array de productos comprados
      cliente: {                                     // Información del cliente que realizó la compra
        email: payment.payer?.email,                 // Email del cliente
        nombre: payment.payer?.first_name,           // Nombre del cliente
        apellido: payment.payer?.last_name,          // Apellido del cliente
        telefono: payment.payer?.phone?.number       // Teléfono del cliente (si está disponible)
      },
      fechaCreacion: new Date(),                     // Fecha actual cuando se crea el pedido
      fechaAprobacion: payment.date_approved ? new Date(payment.date_approved) : new Date(), // Fecha de aprobación del pago
      detallesPago: {                                // Detalles completos del pago para auditoría
        id: payment.id,                              // ID del pago
        status: payment.status,                      // Estado del pago
        status_detail: payment.status_detail,        // Detalle del estado
        payment_type_id: payment.payment_type_id,    // Tipo de pago
        installments: payment.installments,          // Número de cuotas
        card: payment.card ? {                       // Información de la tarjeta (si aplica)
          last_four_digits: payment.card.last_four_digits,        // Últimos 4 dígitos
          cardholder_name: payment.card.cardholder?.name          // Nombre del titular
        } : null                                     // null si no se pagó con tarjeta
      }
    };

    // Guardar en Firestore
    await firestore.collection('pedidos').doc(pedido.id).set(pedido);
    console.log(`✅ Pedido ${pedido.id} creado exitosamente`);
    
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * FUNCIÓN: actualizarStock
 * ============================================================================
 * 
 * Actualiza automáticamente el stock de los productos después de una compra exitosa.
 * 
 * Esta función recorre todos los items comprados y reduce el stock correspondiente
 * en la base de datos. Utiliza transacciones batch para garantizar consistencia.
 * 
 * @param items - Array de items comprados con sus cantidades
 * @returns Promise<void> - No retorna nada, pero puede lanzar errores
 */
async function actualizarStock(items: any[]): Promise<void> {
  try {
    // Obtenemos la instancia de Firestore
    const firestore = admin.firestore();
    
    // Creamos un batch para actualizar múltiples documentos de forma atómica
    // Esto garantiza que todas las actualizaciones se hagan juntas o ninguna
    const batch = firestore.batch();
    
    // --- PROCESAMIENTO DE CADA ITEM COMPRADO ---
    for (const item of items) {
      // Referencia al documento del producto en Firestore
      const productoRef = firestore.collection('productos').doc(item.id);
      
      // Obtenemos el documento actual del producto
      const productoDoc = await productoRef.get();
      
      if (productoDoc.exists) {
        // --- CÁLCULO DEL NUEVO STOCK ---
        const productoData = productoDoc.data();
        const stockActual = productoData?.stock || 0;        // Stock actual (0 si no existe)
        const cantidadComprada = item.quantity;              // Cantidad que se compró
        const nuevoStock = Math.max(0, stockActual - cantidadComprada); // Nuevo stock (mínimo 0)
        
        // Agregamos la actualización al batch
        batch.update(productoRef, {
          stock: nuevoStock,                                 // Nuevo stock calculado
          fechaActualizacion: new Date()                     // Fecha de última actualización
        });
        
        // Log informativo del cambio de stock
        console.log(`📦 Producto ${item.id}: Stock ${stockActual} → ${nuevoStock} (vendidos: ${cantidadComprada})`);
        
        // --- ALERTA DE STOCK BAJO ---
        // Si el stock queda muy bajo, registramos una advertencia
        if (nuevoStock <= 5) {
          console.warn(`⚠️ STOCK BAJO: Producto ${item.id} tiene solo ${nuevoStock} unidades restantes`);
        }
        
        // --- ALERTA DE STOCK AGOTADO ---
        if (nuevoStock === 0) {
          console.warn(`🚨 STOCK AGOTADO: Producto ${item.id} se ha quedado sin stock`);
        }
        
      } else {
        // El producto no existe en la base de datos
        console.warn(`⚠️ Producto ${item.id} no encontrado en la base de datos`);
      }
    }
    
    // --- EJECUCIÓN DE TODAS LAS ACTUALIZACIONES ---
    // Ejecutamos todas las actualizaciones de stock de una vez
    await batch.commit();
    console.log('✅ Stock actualizado exitosamente para todos los productos');
    
  } catch (error) {
    console.error('❌ Error al actualizar stock:', error);
    throw error; // Re-lanzamos el error para que se maneje en el nivel superior
  }
}

/**
 * ============================================================================
 * FUNCIÓN: registrarTransaccion
 * ============================================================================
 * 
 * Registra TODAS las transacciones en la base de datos para auditoría y debugging.
 * 
 * Esta función crea un log completo de cada transacción que pasa por el sistema,
 * incluyendo pagos exitosos, fallidos, pendientes, etc. Es crucial para:
 * - Auditoría financiera
 * - Debugging de problemas
 * - Análisis de ventas
 * - Cumplimiento normativo
 * 
 * @param payment - Objeto completo del pago de Mercado Pago
 * @param estado - Estado de la transacción ('success', 'pending', 'rejected', etc.)
 * @param error - Información del error (opcional, solo si hubo un error)
 * @returns Promise<void> - No retorna nada, no lanza errores para no afectar el flujo principal
 */
async function registrarTransaccion(payment: any, estado: string, error?: any): Promise<void> {
  try {
    // Obtenemos la instancia de Firestore
    const firestore = admin.firestore();
    
    // --- CREACIÓN DEL REGISTRO DE TRANSACCIÓN ---
    // Estructuramos toda la información relevante de la transacción
    const transaccion: Transaccion = {
      paymentId: payment.id.toString(),              // ID del pago en Mercado Pago
      estado: estado as any,                         // Estado de la transacción
      fecha: new Date(),                             // Fecha y hora actual del registro
      detalles: {                                    // Detalles completos del pago
        status: payment.status,                      // Estado del pago en Mercado Pago
        status_detail: payment.status_detail,        // Detalle específico del estado
        transaction_amount: payment.transaction_amount, // Monto de la transacción
        currency_id: payment.currency_id,            // Moneda utilizada
        payment_method_id: payment.payment_method_id, // Método de pago usado
        payer_email: payment.payer?.email,           // Email del pagador
        date_created: payment.date_created,          // Fecha de creación del pago
        date_approved: payment.date_approved         // Fecha de aprobación (si aplica)
      },
      error: error ? {                               // Información del error (si existe)
        message: error.message,                      // Mensaje del error
        stack: error.stack,                          // Stack trace del error
        timestamp: new Date()                        // Momento exacto del error
      } : undefined                                  // undefined si no hay error
    };
    
    // --- GUARDADO EN FIRESTORE ---
    // Guardamos el registro en la colección 'transacciones'
    // Usamos .add() para que Firestore genere un ID único automáticamente
    await firestore.collection('transacciones').add(transaccion);
    
    // Log de confirmación
    console.log(`📝 Transacción registrada exitosamente: ${payment.id} - Estado: ${estado}`);
    
  } catch (error) {
    // --- MANEJO DE ERRORES ---
    // Si hay un error al registrar la transacción, lo logueamos pero NO lanzamos el error
    // Esto es importante para que un fallo en el logging no afecte el procesamiento principal
    console.error('❌ Error al registrar transacción en la base de datos:', error);
    console.error('⚠️ La transacción no se registró, pero el procesamiento del pago continúa');
    
    // NO hacemos throw error aquí para no interrumpir el flujo principal del webhook
  }
}

/**
 * ============================================================================
 * FIN DEL ARCHIVO - RESUMEN DE FUNCIONALIDADES
 * ============================================================================
 * 
 * Este archivo implementa un sistema completo de procesamiento de pagos que incluye:
 * 
 * 🔧 FUNCIONES PRINCIPALES:
 * 1. createPreferenceV1: Crea preferencias de pago en Mercado Pago
 * 2. receiveWebhookV1: Procesa notificaciones de pagos de Mercado Pago
 * 
 * 🛠️ FUNCIONES AUXILIARES:
 * 1. crearPedido: Registra pedidos completos en Firestore
 * 2. actualizarStock: Actualiza automáticamente el inventario
 * 3. registrarTransaccion: Crea logs de auditoría de todas las transacciones
 * 
 * 🔒 SEGURIDAD IMPLEMENTADA:
 * - Validación HMAC-SHA256 de webhooks
 * - Validación exhaustiva de datos de entrada
 * - Configuración CORS restrictiva
 * - Manejo robusto de errores
 * 
 * 📊 COLECCIONES FIRESTORE UTILIZADAS:
 * - productos: Se actualiza el stock automáticamente
 * - pedidos: Se crean registros de pedidos completos
 * - transacciones: Log de auditoría de todas las operaciones
 * 
 * 🚀 FLUJO COMPLETO DE COMPRA:
 * 1. Frontend solicita preferencia de pago → createPreferenceV1
 * 2. Usuario paga en Mercado Pago
 * 3. Mercado Pago notifica → receiveWebhookV1
 * 4. Se valida la firma de seguridad
 * 5. Se crea el pedido → crearPedido
 * 6. Se actualiza el stock → actualizarStock
 * 7. Se registra la transacción → registrarTransaccion
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * Profesor: Sebastian Saldivar
 * Año: 2025
 * ============================================================================
 */
