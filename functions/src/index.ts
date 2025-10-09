/**
 * ============================================================================
 * ALED 2025 - BACKEND FUNCTIONS (IMPLEMENTACIÓN COMPLETA)
 * ============================================================================
 * 
 * Sistema completo de e-commerce con integración a Mercado Pago
 * Registra TODOS los estados de pago para usuario y administrador
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * Profesor: Sebastian Saldivar
 * ============================================================================
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';

// Inicializar Firebase Admin
admin.initializeApp();

// ============================================================================
// CONFIGURACIÓN DE MERCADO PAGO - PRODUCCIÓN
// ============================================================================
const MP_ACCESS_TOKEN = 'APP_USR-748374182945274-100814-0ef9c51f2357669a0d4b47a53e4ea45b-2667547778';
const MP_WEBHOOK_SECRET = '18528dcbd31b3602edad2f7f968ff7d902f0f0116664c45b1a2fe9579b58601f';

// Cliente de Mercado Pago
const mpClient = new MercadoPagoConfig({
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

function setCorsHeaders(response: functions.Response, origin?: string) {
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
export const createPreference = functions.region('us-central1').https.onRequest(async (req, res) => {
  console.log('🚀 Iniciando createPreference - Producción');
  
  setCorsHeaders(res, req.headers.origin as string);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método no permitido' });
      return;
    }

    // Validar datos de entrada
    const { items, usuario } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items del carrito requeridos' });
      return;
    }

    if (!usuario || !usuario.email) {
      res.status(400).json({ error: 'Información del usuario requerida' });
      return;
    }

    for (const item of items) {
      if (!item.producto?.id || !item.producto?.nombre || !item.producto?.precio || !item.cantidad) {
        res.status(400).json({ error: 'Estructura de item inválida' });
        return;
      }
    }

    console.log('📦 Items recibidos:', items.length);

    const preference = new Preference(mpClient);
    
    const preferenceData = {
      items: items.map((item: any) => ({
        id: String(item.producto.id),
        title: item.producto.nombre,
        quantity: Number(item.cantidad),
        unit_price: Number(item.producto.precio),
        currency_id: 'ARS'
      })),
      payer: {
        name: usuario.nombre,
        surname: usuario.apellido,
        email: usuario.email,
        phone: {
          area_code: '11',
          number: usuario.telefono || '1234567890'
        },
        address: {
          street_name: usuario.direccion || 'Sin especificar',
          street_number: '123',
          zip_code: usuario.codigoPostal || '1000'
        }
      },
      back_urls: {
        success: 'https://aled3-6b4ee.web.app/pago-exitoso',
        failure: 'https://aled3-6b4ee.web.app/pago-fallido',
        pending: 'https://aled3-6b4ee.web.app/pago-pendiente'
      },
      auto_return: 'approved',
      notification_url: 'https://us-central1-aled3-6b4ee.cloudfunctions.net/receiveWebhook',
      external_reference: `user_${usuario.id}_${Date.now()}`
    };

    console.log('💳 Creando preferencia en Mercado Pago...');
    const result = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada:', result.id);

    // Crear un registro preliminar del pedido con los datos que tenemos
    try {
      const firestore = admin.firestore();
      const pedidoPreliminar = {
        id: `pedido_preliminar_${result.id}`,
        preferenceId: result.id,
        estado: 'creado',
        total: items.reduce((sum: number, item: any) => sum + (item.cantidad * item.producto.precio), 0),
        moneda: 'ARS',
        items: items.map((item: any) => ({
          id: item.producto.id,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.producto.precio,
          subtotal: item.cantidad * item.producto.precio
        })),
        cliente: {
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono || 'No disponible',
          direccion: usuario.direccion || 'No disponible',
          codigoPostal: usuario.codigoPostal || 'No disponible'
        },
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        externalReference: `user_${usuario.id}_${Date.now()}`
      };

      await firestore.collection('pedidos').doc(pedidoPreliminar.id).set(pedidoPreliminar);
      console.log('📝 Pedido preliminar creado:', pedidoPreliminar.id);
    } catch (error) {
      console.error('⚠️ Error creando pedido preliminar:', error);
      // No fallar la respuesta por esto
    }

    res.status(200).json({ 
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error: any) {
    console.error('❌ Error creando preferencia:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ============================================================================
// FUNCIÓN: RECIBIR WEBHOOKS DE MERCADO PAGO
// ============================================================================
export const receiveWebhook = functions.region('us-central1').https.onRequest(async (req, res) => {
  console.log('🔔 Webhook recibido de Mercado Pago');
  
  setCorsHeaders(res, req.headers.origin as string);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const signature = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;

    if (!signature || !requestId) {
      console.warn('⚠️ Headers de seguridad faltantes');
      res.status(400).send('Headers requeridos faltantes');
      return;
    }

    const isValidSignature = validateWebhookSignature(req.body, signature, requestId);
    
    if (!isValidSignature) {
      console.warn('🚨 Firma de webhook inválida - Posible ataque');
      res.status(403).send('Firma inválida');
      return;
    }

    console.log('✅ Firma de webhook válida');

    if (req.body.type === 'payment') {
      const paymentId = req.body.data.id;
      console.log('💰 Procesando pago:', paymentId);

      const payment = await new Payment(mpClient).get({ id: paymentId });
      console.log('📊 Estado del pago:', payment.status);

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
          await processUnknownPayment(payment);
      }

      res.status(200).send('OK');
    } else {
      console.log('ℹ️ Notificación no es de pago, ignorando');
      res.status(200).send('OK');
    }

  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send('Error interno');
  }
});

// ============================================================================
// FUNCIONES DE PROCESAMIENTO DE PAGOS
// ============================================================================

function validateWebhookSignature(body: any, signature: string, requestId: string): boolean {
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
  } catch (error) {
    console.error('Error validando firma:', error);
    return false;
  }
}

async function processApprovedPayment(payment: any): Promise<void> {
  console.log('✅ Procesando pago aprobado:', payment.id);
  
  try {
    await createOrderWithStatus(payment, 'completado');
    console.log('📝 Pedido completado creado');

    if (payment.additional_info?.items?.length > 0) {
      await updateStock(payment.additional_info.items);
      console.log('📦 Stock actualizado');
    }

    await logTransaction(payment, 'approved');
    console.log('📊 Transacción aprobada registrada');

  } catch (error) {
    console.error('❌ Error procesando pago aprobado:', error);
    await logTransaction(payment, 'error', error);
  }
}

async function processPendingPayment(payment: any): Promise<void> {
  console.log('⏳ Procesando pago pendiente:', payment.id);
  
  try {
    await createOrderWithStatus(payment, 'pendiente');
    console.log('📝 Pedido pendiente creado');
    
    await logTransaction(payment, 'pending');
    console.log('📊 Transacción pendiente registrada');
    
  } catch (error) {
    console.error('❌ Error procesando pago pendiente:', error);
    await logTransaction(payment, 'error', error);
  }
}

async function processRejectedPayment(payment: any): Promise<void> {
  console.log('❌ Procesando pago rechazado:', payment.id);
  
  try {
    await createOrderWithStatus(payment, 'rechazado');
    console.log('📝 Pedido rechazado registrado');
    
    await logTransaction(payment, 'rejected');
    console.log('📊 Transacción rechazada registrada');
    
  } catch (error) {
    console.error('❌ Error procesando pago rechazado:', error);
    await logTransaction(payment, 'error', error);
  }
}

async function processRefundedPayment(payment: any): Promise<void> {
  console.log('💰 Procesando reembolso:', payment.id);
  
  try {
    await updateOrderStatus(payment, 'reembolsado');
    console.log('📝 Pedido marcado como reembolsado');
    
    if (payment.additional_info?.items?.length > 0) {
      await restoreStock(payment.additional_info.items);
      console.log('📦 Stock restaurado');
    }
    
    await logTransaction(payment, 'refunded');
    console.log('📊 Transacción de reembolso registrada');
    
  } catch (error) {
    console.error('❌ Error procesando reembolso:', error);
    await logTransaction(payment, 'error', error);
  }
}

async function processUnknownPayment(payment: any): Promise<void> {
  console.log('❓ Procesando estado desconocido:', payment.id, payment.status);
  
  try {
    await createOrderWithStatus(payment, 'desconocido');
    console.log('📝 Pedido con estado desconocido registrado');
    
    await logTransaction(payment, 'unknown');
    console.log('📊 Transacción desconocida registrada');
    
  } catch (error) {
    console.error('❌ Error procesando estado desconocido:', error);
    await logTransaction(payment, 'error', error);
  }
}

// ============================================================================
// FUNCIONES DE BASE DE DATOS
// ============================================================================

async function createOrderWithStatus(payment: any, estado: string): Promise<void> {
  const firestore = admin.firestore();
  
  console.log('📋 Datos completos del pago recibido:', JSON.stringify(payment, null, 2));
  
  const items = payment.additional_info?.items?.map((item: any) => ({
    id: item.id,
    nombre: item.title,
    cantidad: item.quantity,
    precio: item.unit_price,
    subtotal: item.quantity * item.unit_price
  })) || [];

  // Intentar obtener datos del cliente de múltiples fuentes
  const clienteData = {
    email: payment.payer?.email || payment.additional_info?.payer?.email || 'no-disponible@email.com',
    nombre: payment.payer?.first_name || payment.additional_info?.payer?.first_name || 'Nombre no disponible',
    apellido: payment.payer?.last_name || payment.additional_info?.payer?.last_name || 'Apellido no disponible',
    telefono: payment.payer?.phone?.number || payment.additional_info?.payer?.phone?.number || 'No disponible',
    direccion: payment.payer?.address?.street_name || payment.additional_info?.payer?.address?.street_name || 'No disponible',
    codigoPostal: payment.payer?.address?.zip_code || payment.additional_info?.payer?.address?.zip_code || 'No disponible'
  };

  console.log('👤 Datos del cliente extraídos:', clienteData);

  const order = {
    id: `pedido_${payment.id}`,
    paymentId: payment.id.toString(),
    estado: estado,
    total: payment.transaction_amount,
    moneda: payment.currency_id,
    metodoPago: payment.payment_method_id,
    items: items,
    cliente: clienteData,
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    fechaAprobacion: payment.date_approved ? new Date(payment.date_approved) : null,
    fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    motivoRechazo: payment.status_detail || null,
    externalReference: payment.external_reference || null,
    detallesPago: {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      payment_type_id: payment.payment_type_id,
      installments: payment.installments,
      failure_detail: payment.failure_detail || null,
      payer_info: payment.payer || null
    }
  };

  console.log('💾 Guardando pedido:', order.id);
  await firestore.collection('pedidos').doc(order.id).set(order);
  console.log('✅ Pedido guardado exitosamente');
}

async function updateOrderStatus(payment: any, nuevoEstado: string): Promise<void> {
  const firestore = admin.firestore();
  const pedidoId = `pedido_${payment.id}`;
  
  await firestore.collection('pedidos').doc(pedidoId).update({
    estado: nuevoEstado,
    fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    motivoRechazo: payment.status_detail || null,
    detallesPago: {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      payment_type_id: payment.payment_type_id,
      installments: payment.installments,
      failure_detail: payment.failure_detail || null
    }
  });
}

async function updateStock(items: any[]): Promise<void> {
  const firestore = admin.firestore();
  const batch = firestore.batch();

  for (const item of items) {
    const productRef = firestore.collection('productos').doc(item.id);
    const productDoc = await productRef.get();

    if (productDoc.exists) {
      const productData = productDoc.data();
      const currentStock = productData?.stock || 0;
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

async function restoreStock(items: any[]): Promise<void> {
  const firestore = admin.firestore();
  const batch = firestore.batch();

  for (const item of items) {
    const productRef = firestore.collection('productos').doc(item.id);
    const productDoc = await productRef.get();

    if (productDoc.exists) {
      const productData = productDoc.data();
      const currentStock = productData?.stock || 0;
      const restoredStock = currentStock + item.quantity;

      batch.update(productRef, {
        stock: restoredStock,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`📦 Stock restaurado - Producto ${item.id}: ${currentStock} → ${restoredStock}`);
    }
  }

  await batch.commit();
}

async function logTransaction(payment: any, status: string, error?: any): Promise<void> {
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
        payer_email: payment.payer?.email,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        failure_detail: payment.failure_detail || null
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      } : null
    };

    await firestore.collection('transacciones').add(transaction);
    console.log('📝 Transacción registrada:', payment.id);
    
  } catch (err) {
    console.error('❌ Error registrando transacción:', err);
  }
}

// ============================================================================
// FUNCIÓN DE PRUEBA
// ============================================================================
export const testConnection = functions.region('us-central1').https.onRequest(async (req, res) => {
  setCorsHeaders(res, req.headers.origin as string);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const firestore = admin.firestore();
    await firestore.collection('test').doc('connection').get();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      firebase: 'Connected',
      mercadopago: MP_ACCESS_TOKEN ? 'Configured' : 'Not configured'
    });
  } catch (error) {
    res.status(500).json({ error: 'Connection failed' });
  }
});

// ============================================================================
// FUNCIÓN: OBTENER PEDIDOS DE USUARIO
// ============================================================================
export const getUserOrders = functions.region('us-central1').https.onRequest(async (req, res) => {
  setCorsHeaders(res, req.headers.origin as string);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      res.status(400).json({ error: 'Email requerido' });
      return;
    }

    const firestore = admin.firestore();
    const ordersSnapshot = await firestore
      .collection('pedidos')
      .where('cliente.email', '==', email)
      .orderBy('fechaCreacion', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ orders });

  } catch (error: any) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
