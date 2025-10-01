import * as functions from 'firebase-functions';
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
 * @function createPreference
 * Crea una preferencia de pago en Mercado Pago.
 */
export const createPreference = functions.https.onRequest(async (request, response) => {
  // ... (código de createPreference sin cambios)
});

/**
 * @function receiveWebhook
 * Recibe y procesa las notificaciones de Webhook enviadas por Mercado Pago.
 */
export const receiveWebhook = functions.https.onRequest(async (request, response) => {
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
