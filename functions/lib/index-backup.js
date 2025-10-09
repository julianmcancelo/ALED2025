"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveWebhookV1 = exports.createPreferenceV1 = void 0;
// Importación de módulos necesarios
const functions = require("firebase-functions/v1"); // SDK de Firebase Functions
const admin = require("firebase-admin"); // SDK de Firebase Admin para acceder a Firestore
// @ts-ignore - Ignoramos el error de TypeScript para el SDK de Mercado Pago
const mercadopago_1 = require("mercadopago"); // SDK de Mercado Pago
const crypto = require("crypto"); // Módulo de Node.js para validación de firmas
// Inicializa la aplicación de Firebase Admin
// Esto nos permite interactuar con los servicios de Firebase (Firestore, Auth, etc.)
admin.initializeApp();
// --- CONFIGURACIÓN DE MERCADO PAGO ---
// CREDENCIALES DE PRODUCCIÓN
const MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-748374182945274-100814-0ef9c51f2357669a0d4b47a53e4ea45b-2667547778';
const MERCADOPAGO_SECRET_KEY = '18528dcbd31b3602edad2f7f968ff7d902f0f0116664c45b1a2fe9579b58601f';
// Creamos un cliente de Mercado Pago con nuestras credenciales
const client = new mercadopago_1.MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
});
// Clave secreta para validar webhooks de Mercado Pago
const webhookSecret = MERCADOPAGO_SECRET_KEY;
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
exports.createPreferenceV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
    console.log('🔄 Iniciando createPreferenceV1 - NUEVA VERSIÓN SIMPLE');
    // Debug: Verificar credenciales
    console.log('🔑 Access Token disponible:', MERCADOPAGO_ACCESS_TOKEN ? 'SÍ' : 'NO');
    console.log('🔑 Access Token length:', MERCADOPAGO_ACCESS_TOKEN.length);
    console.log('🔑 Access Token prefix:', MERCADOPAGO_ACCESS_TOKEN.substring(0, 20) + '...');
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
    const origin = request.headers.origin;
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
        const preference = new mercadopago_1.Preference(client);
        // Preparamos los datos en el formato que Mercado Pago requiere
        const preferenceData = {
            // Transformamos los items del carrito al formato de Mercado Pago
            items: items.map((item) => ({
                id: String(item.producto.id),
                title: item.producto.nombre,
                quantity: Number(item.cantidad),
                unit_price: Number(item.producto.precio),
                currency_id: 'ARS', // Moneda: Pesos Argentinos
            })),
            // URLs de retorno: Mercado Pago redirigirá al usuario a estas URLs
            // según el resultado del pago
            back_urls: {
                success: 'https://aled3-6b4ee.web.app/pago-exitoso',
                failure: 'https://aled3-6b4ee.web.app/pago-fallido',
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
    }
    catch (error) {
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
exports.receiveWebhookV1 = functions.region('us-central1').https.onRequest(async (request, response) => {
    var _a;
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
    const origin = request.headers.origin;
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
    const signature = request.headers['x-signature'];
    const requestId = request.headers['x-request-id'];
    // --- VALIDACIÓN DE FIRMA (HMAC-SHA256) ---
    // Esto es CRÍTICO para la seguridad: asegura que la petición realmente viene de Mercado Pago
    // y no es un intento de ataque o fraude
    // La firma viene en formato: "ts=timestamp,v1=hash"
    const [ts, hash] = signature.split(',');
    const timestamp = ts.split('=')[1]; // Extraemos el timestamp
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
            const payment = await new mercadopago_1.Payment(client).get({ id: paymentId });
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
                    if (((_a = payment.additional_info) === null || _a === void 0 ? void 0 : _a.items) && payment.additional_info.items.length > 0) {
                        await actualizarStock(payment.additional_info.items);
                        console.log('✅ Stock actualizado exitosamente');
                    }
                    else {
                        console.warn('⚠️ No se encontraron items en el pago para actualizar stock');
                    }
                    // 3. REGISTRAR TRANSACCIÓN EXITOSA
                    await registrarTransaccion(payment, 'success');
                    console.log('✅ Transacción registrada exitosamente');
                }
                catch (error) {
                    console.error('❌ Error procesando pago aprobado:', error);
                    // Registrar el error pero no fallar el webhook
                    await registrarTransaccion(payment, 'error', error);
                }
            }
            else if (payment.status === 'pending') {
                // ⏳ PAGO PENDIENTE
                console.log(`⏳ Pago pendiente: ${paymentId} - Motivo: ${payment.status_detail}`);
                await registrarTransaccion(payment, 'pending');
            }
            else if (payment.status === 'rejected') {
                // ❌ PAGO RECHAZADO
                console.log(`❌ Pago rechazado: ${paymentId} - Motivo: ${payment.status_detail}`);
                await registrarTransaccion(payment, 'rejected');
            }
            else if (payment.status === 'refunded') {
                // 💰 PAGO REEMBOLSADO
                console.log(`💰 Pago reembolsado: ${paymentId}`);
                // Aquí podrías restaurar el stock si es necesario
                await registrarTransaccion(payment, 'refunded');
            }
            else {
                // ❓ ESTADO DESCONOCIDO
                console.log(`❓ Estado desconocido del pago: ${payment.status} (ID: ${paymentId})`);
                await registrarTransaccion(payment, 'unknown');
            }
            // Respondemos con éxito a Mercado Pago
            // Es importante responder rápido (< 5 segundos) para que no reintente
            response.status(200).send('Webhook recibido exitosamente.');
        }
        catch (error) {
            // Error al procesar el webhook
            console.error('Error procesando webhook:', error);
            response.status(500).send('Error procesando webhook.');
        }
    }
    else {
        // No es una notificación de pago, la ignoramos
        // Mercado Pago puede enviar otros tipos de notificaciones
        response.status(200).send('No es una notificación de pago, omitiendo.');
    }
});
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
async function crearPedido(payment) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        // Obtenemos la instancia de Firestore para interactuar con la base de datos
        const firestore = admin.firestore();
        // --- PREPARACIÓN DE LOS ITEMS DEL PEDIDO ---
        // Convertimos los items de Mercado Pago al formato de nuestro sistema
        const items = ((_b = (_a = payment.additional_info) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.map((item) => ({
            id: item.id,
            nombre: item.title,
            cantidad: item.quantity,
            precio: item.unit_price,
            subtotal: item.quantity * item.unit_price // Cálculo del subtotal
        }))) || []; // Si no hay items, usamos un array vacío
        // --- CREACIÓN DEL OBJETO PEDIDO ---
        // Estructuramos toda la información del pago en un pedido completo
        const pedido = {
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
                telefono: (_g = (_f = payment.payer) === null || _f === void 0 ? void 0 : _f.phone) === null || _g === void 0 ? void 0 : _g.number // Teléfono del cliente (si está disponible)
            },
            fechaCreacion: new Date(),
            fechaAprobacion: payment.date_approved ? new Date(payment.date_approved) : new Date(),
            detallesPago: {
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                payment_type_id: payment.payment_type_id,
                installments: payment.installments,
                card: payment.card ? {
                    last_four_digits: payment.card.last_four_digits,
                    cardholder_name: (_h = payment.card.cardholder) === null || _h === void 0 ? void 0 : _h.name // Nombre del titular
                } : null // null si no se pagó con tarjeta
            }
        };
        // Guardar en Firestore
        await firestore.collection('pedidos').doc(pedido.id).set(pedido);
        console.log(`✅ Pedido ${pedido.id} creado exitosamente`);
    }
    catch (error) {
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
async function actualizarStock(items) {
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
                const stockActual = (productoData === null || productoData === void 0 ? void 0 : productoData.stock) || 0; // Stock actual (0 si no existe)
                const cantidadComprada = item.quantity; // Cantidad que se compró
                const nuevoStock = Math.max(0, stockActual - cantidadComprada); // Nuevo stock (mínimo 0)
                // Agregamos la actualización al batch
                batch.update(productoRef, {
                    stock: nuevoStock,
                    fechaActualizacion: new Date() // Fecha de última actualización
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
            }
            else {
                // El producto no existe en la base de datos
                console.warn(`⚠️ Producto ${item.id} no encontrado en la base de datos`);
            }
        }
        // --- EJECUCIÓN DE TODAS LAS ACTUALIZACIONES ---
        // Ejecutamos todas las actualizaciones de stock de una vez
        await batch.commit();
        console.log('✅ Stock actualizado exitosamente para todos los productos');
    }
    catch (error) {
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
async function registrarTransaccion(payment, estado, error) {
    var _a;
    try {
        // Obtenemos la instancia de Firestore
        const firestore = admin.firestore();
        // --- CREACIÓN DEL REGISTRO DE TRANSACCIÓN ---
        // Estructuramos toda la información relevante de la transacción
        const transaccion = {
            paymentId: payment.id.toString(),
            estado: estado,
            fecha: new Date(),
            detalles: {
                status: payment.status,
                status_detail: payment.status_detail,
                transaction_amount: payment.transaction_amount,
                currency_id: payment.currency_id,
                payment_method_id: payment.payment_method_id,
                payer_email: (_a = payment.payer) === null || _a === void 0 ? void 0 : _a.email,
                date_created: payment.date_created,
                date_approved: payment.date_approved // Fecha de aprobación (si aplica)
            },
            error: error ? {
                message: error.message,
                stack: error.stack,
                timestamp: new Date() // Momento exacto del error
            } : undefined // undefined si no hay error
        };
        // --- GUARDADO EN FIRESTORE ---
        // Guardamos el registro en la colección 'transacciones'
        // Usamos .add() para que Firestore genere un ID único automáticamente
        await firestore.collection('transacciones').add(transaccion);
        // Log de confirmación
        console.log(`📝 Transacción registrada exitosamente: ${payment.id} - Estado: ${estado}`);
    }
    catch (error) {
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
//# sourceMappingURL=index-backup.js.map