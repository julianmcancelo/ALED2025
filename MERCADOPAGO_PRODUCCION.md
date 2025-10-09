# 🚀 Configuración de Mercado Pago en Producción

## ✅ Cambios Realizados

### 1. **Credenciales Actualizadas**
Se han actualizado las credenciales de Mercado Pago a las de producción en:

- **Backend (Firebase Functions):**
  - Archivo: `functions/src/index.ts`
  - Access Token: `APP_USR-748374182945274-100814-0ef9c51f2357669a0d4b47a53e4ea45b-2667547778`
  - Webhook Secret Key: `18528dcbd31b3602edad2f7f968ff7d902f0f0116664c45b1a2fe9579b58601f`
  - Client Secret: `gW0FiSbqLaLlZzt5DlnlVKG9Dla9PUGW`

- **Variables de Entorno:**
  - Archivo: `functions/.env`
  - Incluye también Public Key y Client ID para referencia

### 2. **URL de Checkout Actualizada**
- **Frontend (Angular):**
  - Archivo: `src/app/carrito/carrito.ts`
  - Cambio: De `sandbox.mercadopago.com.ar` a `www.mercadopago.com.ar`

## 📋 Pasos para Desplegar

### Opción 1: Script Automático (Recomendado)
```bash
# Ejecuta el script de despliegue
deploy-production.bat
```

### Opción 2: Despliegue Manual
```bash
# 1. Compilar funciones
cd functions
npm run build
cd ..

# 2. Desplegar funciones a Firebase
firebase deploy --only functions

# 3. Compilar frontend
npm run build

# 4. Desplegar frontend
firebase deploy --only hosting
```

## 🔍 Verificación Post-Despliegue

### 1. **Verificar Funciones en Firebase Console**
- Ve a [Firebase Console](https://console.firebase.google.com)
- Selecciona tu proyecto: `aled3-6b4ee`
- Ve a Functions
- Verifica que estén desplegadas:
  - `createPreferenceV1`
  - `receiveWebhookV1`

### 2. **Configurar Webhook en Mercado Pago**
1. Ingresa a tu [Panel de Mercado Pago](https://www.mercadopago.com.ar/developers/panel)
2. Ve a "Tu integración" → "Webhooks"
3. Configura la URL del webhook:
   ```
   https://us-central1-aled3-6b4ee.cloudfunctions.net/receiveWebhookV1
   ```
4. Selecciona los eventos:
   - ✅ Pagos
   - ✅ Planes y suscripciones (opcional)

### 3. **Prueba de Compra Real**
1. Accede a tu tienda: https://aled3-6b4ee.web.app
2. Agrega productos al carrito
3. Procede al pago
4. Completa una compra con una tarjeta real
5. Verifica en Firestore:
   - Colección `pedidos`: Debe aparecer el nuevo pedido
   - Colección `productos`: Stock debe actualizarse
   - Colección `transacciones`: Debe registrarse la transacción

## ⚠️ Importante

### Credenciales de Producción
- **NUNCA** compartas las credenciales de producción públicamente
- **NUNCA** subas el archivo `.env` a GitHub
- Asegúrate de que `.env` esté en `.gitignore`

### Monitoreo
- Revisa regularmente los logs en Firebase Console
- Monitorea las transacciones en el panel de Mercado Pago
- Configura alertas para errores en Firebase

## 🆘 Solución de Problemas

### Error: "Invalid access token"
- Verifica que las credenciales sean correctas
- Asegúrate de que tu cuenta de Mercado Pago esté activada para producción
- Regenera las credenciales si es necesario

### Error: "Webhook signature invalid"
- Verifica que el Secret Key sea correcto
- Asegúrate de que la URL del webhook esté bien configurada en Mercado Pago

### Los pagos no se procesan
1. Revisa los logs en Firebase Functions
2. Verifica que el webhook esté recibiendo las notificaciones
3. Comprueba que Firestore tenga los permisos correctos

## 📊 Panel de Control

### Mercado Pago
- [Panel de Desarrolladores](https://www.mercadopago.com.ar/developers/panel)
- [Actividad de la cuenta](https://www.mercadopago.com.ar/activities)
- [Configuración de Webhooks](https://www.mercadopago.com.ar/developers/panel/app/[TU_APP_ID]/webhooks)

### Firebase
- [Console](https://console.firebase.google.com/project/aled3-6b4ee)
- [Functions Logs](https://console.firebase.google.com/project/aled3-6b4ee/functions/logs)
- [Firestore](https://console.firebase.google.com/project/aled3-6b4ee/firestore)

## ✨ Estado Actual

El sistema está configurado para **PRODUCCIÓN** con:
- ✅ Credenciales de producción actualizadas
- ✅ URLs de checkout en producción
- ✅ Sistema de webhooks configurado
- ✅ Validación de seguridad HMAC-SHA256
- ✅ Gestión automática de stock
- ✅ Registro completo de transacciones

---

**Última actualización:** 08/10/2025
**Por:** Sistema automatizado de Cascade
