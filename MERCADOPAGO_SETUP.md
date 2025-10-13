# 💳 Configuración de Mercado Pago para ALED2025

## 🎯 Integración Completa Implementada

ALED2025 ahora tiene una **integración directa con Mercado Pago** que permite procesar pagos reales sin necesidad de Firebase Functions.

## 🔧 Configuración Requerida

### 1. Crear Cuenta de Desarrollador

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Crea una cuenta o inicia sesión
3. Ve a "Mis aplicaciones" → "Crear aplicación"
4. Completa los datos de tu aplicación

### 2. Obtener Credenciales

En tu panel de desarrollador encontrarás:

- **Public Key**: `APP_USR-xxxxxxxx-xxxxxx-xxxxxxxx-xxxxxxxx`
- **Access Token**: `APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx`

### 3. Configurar en el Proyecto

Edita el archivo `src/app/config/mercadopago.config.ts`:

```typescript
export const MERCADOPAGO_CONFIG = {
  // CREDENCIALES DE SANDBOX (DESARROLLO)
  SANDBOX: {
    PUBLIC_KEY: 'TU_PUBLIC_KEY_DE_SANDBOX',
    ACCESS_TOKEN: 'TU_ACCESS_TOKEN_DE_SANDBOX'
  },
  
  // CREDENCIALES DE PRODUCCIÓN
  PRODUCTION: {
    PUBLIC_KEY: 'TU_PUBLIC_KEY_DE_PRODUCCION',
    ACCESS_TOKEN: 'TU_ACCESS_TOKEN_DE_PRODUCCION'
  },
  
  SETTINGS: {
    // Cambiar a false para usar producción
    USE_SANDBOX: true,
    // ... resto de configuración
  }
};
```

## 🧪 Modo Sandbox vs Producción

### Sandbox (Desarrollo)
- ✅ Para pruebas y desarrollo
- ✅ No procesa pagos reales
- ✅ Usa tarjetas de prueba
- ✅ `USE_SANDBOX: true`

### Producción
- 💰 Procesa pagos reales
- 💳 Cobra comisiones de Mercado Pago
- 🔒 Requiere validación de la aplicación
- 🚀 `USE_SANDBOX: false`

## 🎨 Características Implementadas

### ✅ Funcionalidades Completas

1. **Creación de Preferencias**: Automática con datos del carrito
2. **Información del Cliente**: Datos completos del usuario
3. **Cálculo de Envío**: 
   - Envío gratis para compras > $50,000
   - Costo fijo de $1,000 para envío a domicilio
4. **URLs de Retorno**: Configuradas para éxito, error y pendiente
5. **Cuotas**: Hasta 12 cuotas sin interés
6. **Metadata**: Información adicional del pedido

### 🔄 Flujo de Pago

```
Usuario confirma compra →
Sistema crea preferencia en Mercado Pago →
Usuario es redirigido a Mercado Pago →
Usuario completa el pago →
Mercado Pago redirige según resultado:
  ✅ /pago-exitoso
  ❌ /pago-fallido  
  ⏳ /pago-pendiente
```

### 📱 Páginas de Resultado

El sistema incluye páginas para manejar todos los estados de pago:

- **Pago Exitoso**: Confirmación y detalles de la compra
- **Pago Fallido**: Información del error y opciones para reintentar
- **Pago Pendiente**: Estado de pago en proceso

## 🛡️ Seguridad

### ⚠️ Importante para Producción

1. **Variables de Entorno**: En producción, las credenciales deben estar en variables de entorno
2. **HTTPS**: Mercado Pago requiere HTTPS en producción
3. **Validación Backend**: Implementar webhooks para validar pagos
4. **Logs**: Mantener logs de todas las transacciones

### 🔒 Ejemplo de Variables de Entorno

```bash
# .env (NO COMMITEAR)
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key-real
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-real
MERCADOPAGO_USE_SANDBOX=false
```

## 🧪 Modo Simulación

Si no tienes credenciales configuradas, el sistema ofrece un **modo simulación** que:

- ✅ Permite probar todo el flujo de compra
- ✅ Simula el proceso de pago
- ✅ Vacía el carrito como si fuera real
- ✅ Muestra confirmaciones realistas

## 🚀 Puesta en Producción

### Lista de Verificación

- [ ] Credenciales de producción configuradas
- [ ] `USE_SANDBOX: false` en configuración
- [ ] HTTPS habilitado en el servidor
- [ ] Páginas de resultado funcionando
- [ ] Webhooks configurados (opcional pero recomendado)
- [ ] Pruebas con tarjetas reales

### 📊 Monitoreo

Mercado Pago proporciona:
- Dashboard con estadísticas de ventas
- Reportes detallados de transacciones
- Herramientas de conciliación
- APIs para consultar estados de pago

## 🆘 Troubleshooting

### Errores Comunes

1. **Error 401**: Credenciales inválidas
   - Verificar Access Token
   - Confirmar que no esté vencido

2. **Error 400**: Datos de preferencia inválidos
   - Verificar formato de items
   - Confirmar que los precios sean números

3. **CORS Error**: Solo en desarrollo local
   - Normal en localhost
   - Se resuelve en producción con HTTPS

### 🔍 Debug

El sistema incluye logging detallado:
- Preferencias enviadas a Mercado Pago
- Respuestas de la API
- URLs de redirección
- Estados de error específicos

## 📞 Soporte

- [Documentación de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs)
- [Foro de Desarrolladores](https://www.mercadopago.com.ar/developers/es/support)
- [Centro de Ayuda](https://www.mercadopago.com.ar/ayuda)

---

**¡Tu tienda ALED2025 está lista para procesar pagos reales con Mercado Pago! 🎉**
