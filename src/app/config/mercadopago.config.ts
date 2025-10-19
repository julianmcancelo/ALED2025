/**
 * CONFIGURACIÓN DE MERCADO PAGO PARA ALED2025
 * ============================================
 * 
 * Este archivo contiene las credenciales y configuración para la integración
 * con Mercado Pago. 
 * 
 * IMPORTANTE: En producción, estas credenciales deben estar en variables de entorno
 * y nunca committearse al repositorio.
 */

export const MERCADOPAGO_CONFIG = {
  // CREDENCIALES DE SANDBOX (DESARROLLO) - ACTUALIZADAS ✅
  // País: Argentina
  // Credenciales de prueba más recientes para testing
  SANDBOX: {
    PUBLIC_KEY: 'APP_USR-4e0509b7-6b19-411f-b7a3-1afcfe625244',
    ACCESS_TOKEN: 'APP_USR-4422657258091486-101221-c565db0ad80257bf31e44034dd70dcc7-2697795063'
  },
  
  // CREDENCIALES DE PRODUCCIÓN - CONFIGURADAS ✅
  // Estas credenciales permiten procesar pagos REALES
  PRODUCTION: {
    PUBLIC_KEY: 'APP_USR-61b85c8d-9e4b-481c-81bb-2208b86995ef',
    ACCESS_TOKEN: 'APP_USR-5856593245904349-101221-53256b0a0c78b0210cae5100e4433d03-2667547778'
  },
  
  // CONFIGURACIÓN GENERAL
  SETTINGS: {
    // ⚠️ IMPORTANTE: Cambiar a false para PAGOS REALES
    // true = Sandbox (pruebas) | false = Producción (pagos reales)
    USE_SANDBOX: true,  // 🧪 MODO SANDBOX - AMBIENTE DE PRUEBAS ACTIVADO
    
    // URLs de retorno
    RETURN_URLS: {
      SUCCESS: '/pago-exitoso',
      FAILURE: '/pago-fallido', 
      PENDING: '/pago-pendiente'
    },
    
    // Configuración de envío
    SHIPPING: {
      COST_DOMICILIO: 1000, // Costo de envío a domicilio en pesos
      FREE_SHIPPING_MIN: 50000 // Envío gratis a partir de este monto
    },
    
    // Configuración de pagos
    PAYMENT: {
      MAX_INSTALLMENTS: 12,
      CURRENCY: 'ARS',
      STATEMENT_DESCRIPTOR: 'ALED2025'
    }
  }
};

/**
 * Obtiene las credenciales según el entorno
 */
export function getMercadoPagoCredentials() {
  return MERCADOPAGO_CONFIG.SETTINGS.USE_SANDBOX 
    ? MERCADOPAGO_CONFIG.SANDBOX 
    : MERCADOPAGO_CONFIG.PRODUCTION;
}

/**
 * Obtiene la configuración de Mercado Pago
 */
export function getMercadoPagoSettings() {
  return MERCADOPAGO_CONFIG.SETTINGS;
}
