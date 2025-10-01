"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveWebhook = exports.createPreference = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// @ts-ignore
const mercadopago_1 = require("mercadopago");
const crypto = require("crypto");
// Inicializa la app de Firebase Admin para poder interactuar con Firebase.
admin.initializeApp();
// --- CONFIGURACIÓN DE MERCADO PAGO ---
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: functions.config().mercadopago.accesstoken,
});
const webhookSecret = functions.config().mercadopago.secretkey;
/**
 * @function createPreference
 * Crea una preferencia de pago en Mercado Pago.
 */
exports.createPreference = functions.https.onRequest(async (request, response) => {
    // ... (código de createPreference sin cambios)
});
/**
 * @function receiveWebhook
 * Recibe y procesa las notificaciones de Webhook enviadas por Mercado Pago.
 */
exports.receiveWebhook = functions.https.onRequest(async (request, response) => {
    const signature = request.headers['x-signature'];
    const requestId = request.headers['x-request-id'];
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
            const payment = await new mercadopago_1.Payment(client).get({ id: paymentId });
            if (payment.status === 'approved') {
                console.log(`✅ Pago aprobado: ${paymentId}`);
                // TODO: Lógica de negocio (actualizar stock, etc.)
            }
            else {
                console.log(`⚠️ Estado del pago: ${payment.status} (ID: ${paymentId})`);
            }
            response.status(200).send('Webhook received successfully.');
        }
        catch (error) {
            console.error('Error processing webhook:', error);
            response.status(500).send('Error processing webhook.');
        }
    }
    else {
        response.status(200).send('Not a payment notification, skipping.');
    }
});
//# sourceMappingURL=index.js.map