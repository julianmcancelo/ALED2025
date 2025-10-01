/**
 * Importa los módulos necesarios.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializa la app de Firebase Admin para poder interactuar con Firebase.
admin.initializeApp();

// --- CONFIGURACIÓN DE MERCADO PAGO ---
// Configura el cliente de Mercado Pago con tu Access Token de prueba.
// ¡IMPORTANTE! Nunca expongas tu Access Token de producción en el código.
const client = new MercadoPagoConfig({
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
export const createPreference = functions.https.onRequest(async (request, response) => {
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
      response.status(400).send("Bad Request: 'items' array is missing or empty.");
      return;
    }

    // --- CREACIÓN DE LA PREFERENCIA DE PAGO ---
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        // Mapea los productos del carrito al formato que Mercado Pago requiere.
        items: items.map((item: any) => ({
          id: item.producto.id,
          title: item.producto.nombre,
          quantity: item.cantidad,
          unit_price: item.producto.precio,
          currency_id: 'ARS', // Moneda Argentina
        })),
        // URLs a las que Mercado Pago redirigirá al usuario después del pago.
        back_urls: {
          success: 'http://localhost:4200/pago-exitoso', // URL de tu app
          failure: 'http://localhost:4200/pago-fallido',
          pending: 'http://localhost:4200/pago-pendiente',
        },
      },
    });

    // Devuelve el ID de la preferencia al frontend.
    response.status(200).json({ id: result.id });
  } catch (error: any) {
    // Mejoramos el log para capturar más detalles del error de la SDK de Mercado Pago.
    console.error('Error al crear la preferencia de pago:', error);

    // La SDK de Mercado Pago a menudo devuelve detalles en 'error.cause'.
    if (error.cause) {
      console.error('Causa detallada:', JSON.stringify(error.cause, null, 2));
    }

    response.status(500).send('Internal Server Error');
  }
});
