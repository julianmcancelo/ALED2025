# 🚀 ACTIVAR PAGOS REALES - MERCADO PAGO PRODUCCIÓN

## ⚠️ IMPORTANTE: LEER ANTES DE ACTIVAR

Tu tienda ALED2025 está configurada con **credenciales de producción** de Mercado Pago, pero actualmente está en **modo sandbox** (pruebas).

## 🔧 PARA ACTIVAR PAGOS REALES:

### **Paso 1: Cambiar Configuración**
En el archivo `src/app/config/mercadopago.config.ts`:

```typescript
SETTINGS: {
  // Cambiar de true a false
  USE_SANDBOX: false,  // ← CAMBIAR AQUÍ
}
```

### **Paso 2: Hacer Build y Desplegar**
```bash
# 1. Hacer build de producción
npx ng build --configuration development

# 2. Desplegar a Firebase
firebase deploy
```

## 💳 CREDENCIALES CONFIGURADAS:

### **✅ PRODUCCIÓN (Pagos Reales)**:
- **Public Key**: `APP_USR-61b85c8d-9e4b-481c-81bb-2208b86995ef`
- **Access Token**: `APP_USR-5856593245904349-101221-53256b0a0c78b0210cae5100e4433d03-2667547778`
- **Client ID**: `5856593245904349`
- **Client Secret**: `EnE7cUHG4ye3FZlY5BXHv8JWJLc6i0gr`

### **✅ SANDBOX (Pruebas)**:
- **Public Key**: `APP_USR-4e0509b7-6b19-411f-b7a3-1afcfe625244`
- **Access Token**: `APP_USR-4422657258091486-101221-c565db0ad80257bf31e44034dd70dcc7-2697795063`

## 🎯 DIFERENCIAS ENTRE MODOS:

### **SANDBOX (Actual)**:
- ✅ **Pagos simulados**: No se cobra dinero real
- ✅ **Tarjetas de prueba**: Usar tarjetas específicas de MP
- ✅ **Seguro para testing**: Sin riesgos financieros
- ✅ **Perfecto para desarrollo**: Probar funcionalidades

### **PRODUCCIÓN (Al activar)**:
- 💰 **Pagos reales**: Se cobra dinero real a los clientes
- 💳 **Tarjetas reales**: Los clientes usan sus tarjetas verdaderas
- 📊 **Comisiones**: Mercado Pago cobra comisiones por transacción
- 🏪 **Tienda real**: Lista para recibir clientes

## ⚡ CHECKLIST ANTES DE ACTIVAR:

- [ ] **Probar completamente en sandbox**: Todos los flujos funcionando
- [ ] **Verificar productos**: Precios y descripciones correctas
- [ ] **Configurar envíos**: Costos y zonas de entrega
- [ ] **Probar administración**: Panel de admin funcionando
- [ ] **Verificar URLs**: Todas las páginas de retorno funcionando
- [ ] **Backup de datos**: Respaldar base de datos
- [ ] **Informar al equipo**: Avisar que se activarán pagos reales

## 🔒 SEGURIDAD EN PRODUCCIÓN:

### **Variables de Entorno (Recomendado)**:
Para mayor seguridad, las credenciales deberían estar en variables de entorno:

```typescript
// Configuración segura (futuro)
PRODUCTION: {
  PUBLIC_KEY: process.env['MP_PUBLIC_KEY'],
  ACCESS_TOKEN: process.env['MP_ACCESS_TOKEN']
}
```

### **Monitoreo**:
- **Dashboard MP**: https://www.mercadopago.com.ar/activities
- **Transacciones**: Revisar regularmente
- **Reportes**: Configurar notificaciones

## 📊 COMISIONES MERCADO PAGO:

### **Tarjetas de Crédito**:
- **Cuotas 1-6**: ~2.99% + $2.99
- **Cuotas 7-12**: ~3.99% + $2.99

### **Tarjetas de Débito**:
- **Débito**: ~1.99% + $2.99

### **Otros Medios**:
- **Efectivo**: ~2.99% + $2.99
- **Transferencia**: ~1.99% + $2.99

## 🚨 IMPORTANTE:

### **AL ACTIVAR PRODUCCIÓN**:
1. **Los pagos serán REALES**
2. **Se cobrará a los clientes**
3. **Mercado Pago cobrará comisiones**
4. **Debes cumplir con obligaciones fiscales**
5. **Necesitas atención al cliente**

### **RESPONSABILIDADES**:
- **Entregar productos**: Cumplir con las ventas
- **Atención al cliente**: Resolver problemas
- **Facturación**: Emitir comprobantes
- **Devoluciones**: Política clara de devoluciones

## 🎉 CUANDO ESTÉS LISTO:

1. **Cambiar `USE_SANDBOX: false`**
2. **Hacer build y deploy**
3. **Probar con una compra pequeña**
4. **Verificar que llegue el dinero**
5. **¡Tu tienda está ONLINE y REAL!**

---

**¡Tu tienda ALED2025 está lista para ser una tienda real con pagos reales!** 🛒💰

**URL de tu tienda**: https://aled2025-5be25.web.app
