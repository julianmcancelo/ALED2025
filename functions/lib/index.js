"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPreference = void 0;
/**
 * Importa los módulos necesarios.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago_1 = require("mercadopago");
// Inicializa la app de Firebase Admin para poder interactuar con Firebase.
admin.initializeApp();
// --- CONFIGURACIÓN DE MERCADO PAGO ---
// Configura el cliente de Mercado Pago con tu Access Token de prueba.
// ¡IMPORTANTE! Nunca expongas tu Access Token de producción en el código.
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: 'TEST-6441831883142998-100108-00aaeaebb4d1ce895323768f8f4e13b4-2667547778',
});
/**
 * @function createPreference
 * Crea una preferencia de pago en Mercado Pago.
 * Es una función HTTP que se puede llamar desde el frontend.
 *
 * @param {functions.https.Request} request - El objeto de la solicitud HTTP.
 *   Debe contener en el body un array de 'items'.
 * @param {functions.Response<any>} response - El objeto de respuesta HTTP.
 *
 * @returns {Promise<void>}
 */
// Forzando un cambio para el redespliegue.
exports.createPreference = functions.https.onRequest(async (request, response) => {
    // Configura los encabezados CORS para permitir solicitudes desde cualquier origen.
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    // Si la solicitud es un 'preflight' de CORS (método OPTIONS), termina la ejecución aquí.
    if (request.method === 'OPTIONS') {
        response.status(204).send();
        return;
    }
    // Continúa solo si el método es POST.
    if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
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
        const preference = new mercadopago_1.Preference(client);
        const preferenceData = {
            // Mapea los productos del carrito al formato que Mercado Pago requiere.
            items: items.map((item) => ({
                id: String(item.producto.id),
                title: item.producto.nombre,
                quantity: Number(item.cantidad),
                unit_price: Number(item.producto.precio),
                currency_id: 'ARS', // Moneda Argentina
            })),
            // URLs a las que Mercado Pago redirigirá al usuario después del pago.
            back_urls: {
                success: 'http://localhost:4201/pago-exitoso',
                failure: 'http://localhost:4201/pago-fallido',
                pending: 'http://localhost:4201/pago-pendiente'
            }
        };
        console.log('Datos de preferencia:', JSON.stringify(preferenceData, null, 2));
        const result = await preference.create({
            body: preferenceData,
        });
        console.log('Preferencia creada exitosamente:', result.id);
        // Devuelve el ID de la preferencia al frontend.
        response.status(200).json({ id: result.id });
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map