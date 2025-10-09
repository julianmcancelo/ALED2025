"use strict";
/**
 * ============================================================================
 * ALED 2025 - BACKEND FUNCTIONS (NUEVA IMPLEMENTACIÓN)
 * ============================================================================
 *
 * Sistema completo de e-commerce con integración a Mercado Pago
 * Implementación limpia y optimizada para producción
 *
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * Profesor: Sebastian Saldivar
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.receiveWebhook = exports.createPreference = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const mercadopago_1 = require("mercadopago");
const crypto = require("crypto");
// Inicializar Firebase Admin
admin.initializeApp();
// ============================================================================
// CONFIGURACIÓN DE MERCADO PAGO - PRODUCCIÓN
// ============================================================================
const MP_ACCESS_TOKEN = 'APP_USR-748374182945274-100814-0ef9c51f2357669a0d4b47a53e4ea45b-2667547778';
const MP_WEBHOOK_SECRET = '18528dcbd31b3602edad2f7f968ff7d902f0f0116664c45b1a2fe9579b58601f';
// Cliente de Mercado Pago
const mpClient = new mercadopago_1.MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
});
// ============================================================================
// CONFIGURACIÓN CORS
// ============================================================================
const ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:4202',
    'https://aled3-6b4ee.web.app',
    'https://aled3-6b4ee.firebaseapp.com'
];
function setCorsHeaders(response, origin) {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.set('Access-Control-Allow-Origin', origin);
    }
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-request-id');
    response.set('Access-Control-Allow-Credentials', 'true');
}
// ============================================================================
// FUNCIÓN: CREAR PREFERENCIA DE PAGO
// ============================================================================
exports.createPreference = functions.region('us-central1').https.onRequest(async (req, res) => {
    var _a, _b, _c;
    console.log('🚀 Iniciando createPreference - Producción');
    // Configurar CORS
    setCorsHeaders(res, req.headers.origin);
    // Manejar preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        // Validar método HTTP
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Método no permitido' });
            return;
        }
        // Validar datos de entrada
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Items del carrito requeridos' });
            return;
        }
        // Validar estructura de cada item
        for (const item of items) {
            if (!((_a = item.producto) === null || _a === void 0 ? void 0 : _a.id) || !((_b = item.producto) === null || _b === void 0 ? void 0 : _b.nombre) || !((_c = item.producto) === null || _c === void 0 ? void 0 : _c.precio) || !item.cantidad) {
                res.status(400).json({ error: 'Estructura de item inválida' });
                return;
            }
        }
        console.log('📦 Items recibidos:', items.length);
        // Crear preferencia
        const preference = new mercadopago_1.Preference(mpClient);
        const preferenceData = {
            items: items.map((item) => ({
                id: String(item.producto.id),
                title: item.producto.nombre,
                quantity: Number(item.cantidad),
                unit_price: Number(item.producto.precio),
                currency_id: 'ARS'
            })),
            back_urls: {
                success: 'https://aled3-6b4ee.web.app/pago-exitoso',
                failure: 'https://aled3-6b4ee.web.app/pago-fallido',
                pending: 'https://aled3-6b4ee.web.app/pago-pendiente'
            },
            auto_return: 'approved',
            notification_url: 'https://us-central1-aled3-6b4ee.cloudfunctions.net/receiveWebhook'
        };
        console.log('💳 Creando preferencia en Mercado Pago...');
        const result = await preference.create({ body: preferenceData });
        console.log('✅ Preferencia creada:', result.id);
        res.status(200).json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });
    }
    catch (error) {
        console.error('❌ Error creando preferencia:', error);
        console.error('Detalles:', error.message);
        if (error.cause) {
            console.error('Causa:', JSON.stringify(error.cause, null, 2));
        }
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});
// ============================================================================
// FUNCIÓN: RECIBIR WEBHOOKS DE MERCADO PAGO
// ============================================================================
exports.receiveWebhook = functions.region('us-central1').https.onRequest(async (req, res) => {
    console.log('🔔 Webhook recibido de Mercado Pago');
    // Configurar CORS
    setCorsHeaders(res, req.headers.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        // Extraer headers de seguridad
        const signature = req.headers['x-signature'];
        const requestId = req.headers['x-request-id'];
        if (!signature || !requestId) {
            console.warn('⚠️ Headers de seguridad faltantes');
            res.status(400).send('Headers requeridos faltantes');
            return;
        }
        // Validar firma HMAC
        const isValidSignature = validateWebhookSignature(req.body, signature, requestId);
        if (!isValidSignature) {
            console.warn('🚨 Firma de webhook inválida - Posible ataque');
            res.status(403).send('Firma inválida');
            return;
        }
        console.log('✅ Firma de webhook válida');
        // Procesar solo notificaciones de pago
        if (req.body.type === 'payment') {
            const paymentId = req.body.data.id;
            console.log('💰 Procesando pago:', paymentId);
            // Obtener detalles del pago
            const payment = await new mercadopago_1.Payment(mpClient).get({ id: paymentId });
            console.log('📊 Estado del pago:', payment.status);
            // Procesar según el estado
            switch (payment.status) {
                case 'approved':
                    await processApprovedPayment(payment);
                    break;
                case 'pending':
                    await processPendingPayment(payment);
                    break;
                case 'rejected':
                    await processRejectedPayment(payment);
                    break;
                case 'refunded':
                    await processRefundedPayment(payment);
                    break;
                default:
                    console.log('❓ Estado desconocido:', payment.status);
                    await logTransaction(payment, 'unknown');
            }
            res.status(200).send('OK');
        }
        else {
            console.log('ℹ️ Notificación no es de pago, ignorando');
            res.status(200).send('OK');
        }
    }
    catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).send('Error interno');
    }
});
// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================
/**
 * Valida la firma HMAC del webhook
 */
function validateWebhookSignature(body, signature, requestId) {
    try {
        const [ts, hash] = signature.split(',');
        const timestamp = ts.split('=')[1];
        const receivedHash = hash.split('=')[1];
        const manifest = `id:${body.data.id};request-id:${requestId};ts:${timestamp};`;
        const calculatedHash = crypto
            .createHmac('sha256', MP_WEBHOOK_SECRET)
            .update(manifest)
            .digest('hex');
        return calculatedHash === receivedHash;
    }
    catch (error) {
        console.error('Error validando firma:', error);
        return false;
    }
}
/**
 * Procesa pagos aprobados
 */
async function processApprovedPayment(payment) {
    var _a, _b;
    console.log('✅ Procesando pago aprobado:', payment.id);
    try {
        // 1. Crear pedido
        await createOrder(payment);
        console.log('📝 Pedido creado');
        // 2. Actualizar stock
        if (((_b = (_a = payment.additional_info) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            await updateStock(payment.additional_info.items);
            console.log('📦 Stock actualizado');
        }
        // 3. Registrar transacción
        await logTransaction(payment, 'approved');
        console.log('📊 Transacción registrada');
    }
    catch (error) {
        console.error('❌ Error procesando pago aprobado:', error);
        await logTransaction(payment, 'error', error);
    }
}
/**
 * Procesa pagos pendientes
 */
async function processPendingPayment(payment) {
    console.log('⏳ Pago pendiente:', payment.id);
    await logTransaction(payment, 'pending');
}
/**
 * Procesa pagos rechazados
 */
async function processRejectedPayment(payment) {
    console.log('❌ Pago rechazado:', payment.id);
    await logTransaction(payment, 'rejected');
}
/**
 * Procesa reembolsos
 */
async function processRefundedPayment(payment) {
    console.log('💰 Pago reembolsado:', payment.id);
    await logTransaction(payment, 'refunded');
    // Aquí podrías restaurar el stock si es necesario
}
/**
 * Crea un pedido en Firestore
 */
async function createOrder(payment) {
    var _a, _b, _c, _d, _e, _f, _g;
    const firestore = admin.firestore();
    const items = ((_b = (_a = payment.additional_info) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.map((item) => ({
        id: item.id,
        nombre: item.title,
        cantidad: item.quantity,
        precio: item.unit_price,
        subtotal: item.quantity * item.unit_price
    }))) || [];
    const order = {
        id: `pedido_${payment.id}`,
        paymentId: payment.id.toString(),
        estado: 'completado',
        total: payment.transaction_amount,
        moneda: payment.currency_id,
        metodoPago: payment.payment_method_id,
        items: items,
        cliente: {
            email: (_c = payment.payer) === null || _c === void 0 ? void 0 : _c.email,
            nombre: (_d = payment.payer) === null || _d === void 0 ? void 0 : _d.first_name,
            apellido: (_e = payment.payer) === null || _e === void 0 ? void 0 : _e.last_name,
            telefono: (_g = (_f = payment.payer) === null || _f === void 0 ? void 0 : _f.phone) === null || _g === void 0 ? void 0 : _g.number
        },
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaAprobacion: payment.date_approved ? new Date(payment.date_approved) : admin.firestore.FieldValue.serverTimestamp(),
        detallesPago: {
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            payment_type_id: payment.payment_type_id,
            installments: payment.installments
        }
    };
    await firestore.collection('pedidos').doc(order.id).set(order);
}
/**
 * Actualiza el stock de productos
 */
async function updateStock(items) {
    const firestore = admin.firestore();
    const batch = firestore.batch();
    for (const item of items) {
        const productRef = firestore.collection('productos').doc(item.id);
        const productDoc = await productRef.get();
        if (productDoc.exists) {
            const productData = productDoc.data();
            const currentStock = (productData === null || productData === void 0 ? void 0 : productData.stock) || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            batch.update(productRef, {
                stock: newStock,
                fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`📦 Producto ${item.id}: ${currentStock} → ${newStock}`);
            if (newStock <= 5) {
                console.warn(`⚠️ Stock bajo: Producto ${item.id} tiene ${newStock} unidades`);
            }
        }
    }
    await batch.commit();
}
/**
 * Registra transacciones para auditoría
 */
async function logTransaction(payment, status, error) {
    var _a;
    try {
        const firestore = admin.firestore();
        const transaction = {
            paymentId: payment.id.toString(),
            estado: status,
            fecha: admin.firestore.FieldValue.serverTimestamp(),
            detalles: {
                status: payment.status,
                status_detail: payment.status_detail,
                transaction_amount: payment.transaction_amount,
                currency_id: payment.currency_id,
                payment_method_id: payment.payment_method_id,
                payer_email: (_a = payment.payer) === null || _a === void 0 ? void 0 : _a.email,
                date_created: payment.date_created,
                date_approved: payment.date_approved
            },
            error: error ? {
                message: error.message,
                stack: error.stack,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            } : null
        };
        await firestore.collection('transacciones').add(transaction);
        console.log('📝 Transacción registrada:', payment.id);
    }
    catch (err) {
        console.error('❌ Error registrando transacción:', err);
    }
}
// ============================================================================
// FUNCIÓN DE PRUEBA
// ============================================================================
exports.testConnection = functions.region('us-central1').https.onRequest(async (req, res) => {
    setCorsHeaders(res, req.headers.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const firestore = admin.firestore();
        const testDoc = await firestore.collection('test').doc('connection').get();
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            firebase: 'Connected',
            mercadopago: MP_ACCESS_TOKEN ? 'Configured' : 'Not configured'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Connection failed' });
    }
});
//# sourceMappingURL=index-new.js.map