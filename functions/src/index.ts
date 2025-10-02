import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
// @ts-ignore
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';

// Inicializa la app de Firebase Admin para poder interactuar con Firebase.
admin.initializeApp();

// --- CONFIGURACIÓN DE MERCADO PAGO ---
const client = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.accesstoken,
});
const webhookSecret = functions.config().mercadopago.secretkey;

/**
 * @function createPreferenceV1
 * Crea una preferencia de pago en Mercado Pago.
 */
export const createPreferenceV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
  // Configuración CORS
  const allowedOrigins = [
    'http://localhost:4201',
    'http://localhost:4202',
    'http://127.0.0.1:4201',
    'http://127.0.0.1:4202',
    'https://aled-2025.vercel.app'
  ];
  const origin = request.headers.origin as string;
  if (origin && allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight request
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    const items = request.body.items;

    // Valida que se hayan enviado 'items' en el cuerpo de la solicitud.
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Error de validación: items array is missing or empty');
      response.status(400).json({ error: "Bad Request: 'items' array is missing or empty." });
      return;
    }

    // Validar estructura de cada item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.producto || !item.cantidad) {
        console.error(`Error de validación: Item ${i} missing producto or cantidad`, item);
        response.status(400).json({ error: `Item ${i} is missing required fields` });
        return;
      }
      
      if (!item.producto.id || !item.producto.nombre || typeof item.producto.precio !== 'number') {
        console.error(`Error de validación: Item ${i} producto missing required fields`, item.producto);
        response.status(400).json({ error: `Item ${i} producto is missing required fields` });
        return;
      }
      
      if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        console.error(`Error de validación: Item ${i} invalid cantidad`, item.cantidad);
        response.status(400).json({ error: `Item ${i} has invalid cantidad` });
        return;
      }
    }

    console.log('Creando preferencia para items:', JSON.stringify(items, null, 2));

    // --- CREACIÓN DE LA PREFERENCIA DE PAGO ---
    const preference = new Preference(client);
    
    const preferenceData = {
      // Mapea los productos del carrito al formato que Mercado Pago requiere.
      items: items.map((item: any) => ({
        id: String(item.producto.id), // Asegurar que sea string
        title: item.producto.nombre,
        quantity: Number(item.cantidad),
        unit_price: Number(item.producto.precio),
        currency_id: 'ARS', // Moneda Argentina
      })),
      // URLs a las que Mercado Pago redirigirá al usuario después del pago.
      back_urls: {
        success: 'http://localhost:4202/pago-exitoso',
        failure: 'http://localhost:4202/pago-fallido',
        pending: 'http://localhost:4202/pago-pendiente'
      }
    };

    console.log('Datos de preferencia:', JSON.stringify(preferenceData, null, 2));

    const result = await preference.create({
      body: preferenceData,
    });

    console.log('Preferencia creada exitosamente:', result.id);
    
    // Devuelve el ID de la preferencia al frontend.
    response.status(200).json({ id: result.id });
  } catch (error: any) {
    // Mejoramos el log para capturar más detalles del error de la SDK de Mercado Pago.
    console.error('Error al crear la preferencia de pago:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // La SDK de Mercado Pago a menudo devuelve detalles en 'error.cause'.
    if (error.cause) {
      console.error('Causa detallada:', JSON.stringify(error.cause, null, 2));
    }

    // Verificar si es un error de la API de Mercado Pago
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    response.status(500).json({ 
      error: 'Error al crear la preferencia de pago.',
      details: error.message 
    });
  }
});

/**
 * @function receiveWebhookV1
 * Recibe y procesa las notificaciones de Webhook enviadas por Mercado Pago.
 */
export const receiveWebhookV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
  // Configuración CORS
  const allowedOrigins = [
    'http://localhost:4201',
    'http://localhost:4202',
    'http://127.0.0.1:4201',
    'http://127.0.0.1:4202',
    'https://aled-2025.vercel.app'
  ];
  const origin = request.headers.origin as string;
  if (origin && allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
  }
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-request-id');
  response.set('Access-Control-Allow-Credentials', 'true');

  // Manejar preflight request
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  const signature = request.headers['x-signature'] as string;
  const requestId = request.headers['x-request-id'] as string;

  // 1. Validar la firma para asegurar que la petición viene de Mercado Pago
  const [ts, hash] = signature.split(',');
  const timestamp = ts.split('=')[1];
  const receivedHash = hash.split('=')[1];

  const manifest = `id:${request.body.data.id};request-id:${requestId};ts:${timestamp};`;
  const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

  if (hmac !== receivedHash) {
    console.warn('Firma de Webhook inválida.');
    response.status(403).send('Forbidden');
    return;
  }

  // 2. Procesar la notificación
  if (request.body.type === 'payment') {
    try {
      const paymentId = request.body.data.id;
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment.status === 'approved') {
        console.log(`✅ Pago aprobado: ${paymentId}`);
        // TODO: Lógica de negocio (actualizar stock, etc.)
      } else {
        console.log(`⚠️ Estado del pago: ${payment.status} (ID: ${paymentId})`);
      }
      response.status(200).send('Webhook received successfully.');
    } catch (error) {
      console.error('Error processing webhook:', error);
      response.status(500).send('Error processing webhook.');
    }
  } else {
    response.status(200).send('Not a payment notification, skipping.');
  }
});
