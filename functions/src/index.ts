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
      console.error('Error de validación: items array is missing or empty');
      response.status(400).json({ error: "Bad Request: 'items' array is missing or empty." });
      return;
    }

    // VALIDACIÓN 2: Verificamos la estructura de cada item del carrito
    // Cada item debe tener un producto y una cantidad válidos
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Verificamos que el item tenga producto y cantidad
      if (!item.producto || !item.cantidad) {
        console.error(`Error de validación: Item ${i} missing producto or cantidad`, item);
        response.status(400).json({ error: `Item ${i} is missing required fields` });
        return;
      }
      
      // Verificamos que el producto tenga todos los campos necesarios
      // id: identificador único del producto
      // nombre: nombre del producto para mostrar en Mercado Pago
      // precio: debe ser un número válido
      if (!item.producto.id || !item.producto.nombre || typeof item.producto.precio !== 'number') {
        console.error(`Error de validación: Item ${i} producto missing required fields`, item.producto);
        response.status(400).json({ error: `Item ${i} producto is missing required fields` });
        return;
      }
      
      // Verificamos que la cantidad sea un número positivo
      if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        console.error(`Error de validación: Item ${i} invalid cantidad`, item.cantidad);
        response.status(400).json({ error: `Item ${i} has invalid cantidad` });
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
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // La SDK de Mercado Pago puede devolver información adicional en 'error.cause'
    if (error.cause) {
      console.error('Causa detallada:', JSON.stringify(error.cause, null, 2));
    }

    // Si es un error de la API de Mercado Pago, registramos la respuesta
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    // Devolvemos un error 500 (Internal Server Error) al frontend
    response.status(500).json({ 
      error: 'Error al crear la preferencia de pago.',
      details: error.message 
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
    response.status(403).send('Forbidden');
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
        
        // AQUÍ VA LA LÓGICA DE NEGOCIO:
        // 1. Crear registro del pedido en Firestore
        // 2. Actualizar stock de productos
        // 3. Enviar email de confirmación al cliente
        // 4. Generar factura
        // 5. Notificar al administrador
        // etc.
        
        // Ejemplo de cómo se vería:
        // await crearPedido(payment);
        // await actualizarStock(payment.items);
        // await enviarEmailConfirmacion(payment.payer.email);
        
      } else {
        // ⚠️ PAGO EN OTRO ESTADO (pendiente, rechazado, etc.)
        console.log(`⚠️ Estado del pago: ${payment.status} (ID: ${paymentId})`);
        
        // Aquí podríamos manejar otros estados:
        // - 'pending': Pago pendiente de confirmación
        // - 'rejected': Pago rechazado
        // - 'refunded': Pago reembolsado
        // etc.
      }
      
      // Respondemos con éxito a Mercado Pago
      // Es importante responder rápido (< 5 segundos) para que no reintente
      response.status(200).send('Webhook received successfully.');
      
    } catch (error) {
      // Error al procesar el webhook
      console.error('Error processing webhook:', error);
      response.status(500).send('Error processing webhook.');
    }
  } else {
    // No es una notificación de pago, la ignoramos
    // Mercado Pago puede enviar otros tipos de notificaciones
    response.status(200).send('Not a payment notification, skipping.');
  }
});
