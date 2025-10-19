# E-Commerce con Angular y Firebase

> Proyecto Final - Algoritmos y Estructura de Datos III (ALED III)  
> Tecnicatura en Analista de Sistemas

---

## Equipo de Desarrollo

**Alumnos:**
- **Cancelo Julian**
- **Nicolas Otero**

**Profesor:**
- **Sebastian Saldivar**

**Año:** 2025

---

## Descripción del Proyecto

Desarrollamos un **sistema completo de e-commerce** desde cero, aplicando todo lo aprendido en la materia. La aplicación permite a los usuarios navegar por un catálogo de productos, agregarlos al carrito y realizar pagos reales mediante **Mercado Pago**.

Implementamos autenticación personalizada, un panel de administración completo, y un sistema de gestión de envíos. Todo el código está comentado en español para facilitar su comprensión.

### Características principales

- **Catálogo de productos** con búsqueda y filtros
- **Carrito de compras** con estado reactivo (Signals)
- **Integración real con Mercado Pago** (pagos en sandbox)
- **Sistema de tarjeta virtual** - Simulador de tarjeta de crédito integrado
- **Autenticación personalizada** con bcrypt
- **Gestión de perfiles** con datos de envío
- **Selección de método de entrega** (envío o retiro)
- **Panel de administración** completo (CRUD de productos y usuarios)
- **Diseño responsive** que funciona en móviles y desktop
- **Tiempo real** con Firestore listeners

---

## Tecnologías Utilizadas

### Frontend
- **Angular 18** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Framework de estilos
- **Bootstrap 5** - Componentes UI
- **Angular Material** - Componentes adicionales
- **SweetAlert2** - Modales y alertas
- **RxJS** - Programación reactiva
- **Signals** - Nueva API reactiva de Angular

### Backend
- **Firebase Cloud Functions** - Backend serverless
- **Node.js** - Runtime de JavaScript
- **Mercado Pago SDK** - Integración de pagos

### Base de Datos
- **Firebase Firestore** - Base de datos NoSQL en tiempo real

### Seguridad
- **bcryptjs** - Hash de contraseñas
- **CORS** - Seguridad de peticiones
- **HMAC-SHA256** - Validación de webhooks

---

## Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Cuenta de Firebase
- Cuenta de Mercado Pago (para pagos)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/julianmcancelo/ALED2025.git
   cd ALED2025
   ```

2. **Instalar dependencias del frontend**
   ```bash
   npm install
   ```

3. **Instalar dependencias de Firebase Functions**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Configurar Firebase**
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Firestore Database
   - Habilitar Firebase Hosting
   - Copiar las credenciales en `src/app/app.config.ts`

5. **Configurar Mercado Pago** (opcional para desarrollo)
   ```bash
   firebase functions:config:set mercadopago.accesstoken="TU_ACCESS_TOKEN"
   firebase functions:config:set mercadopago.secretkey="TU_SECRET_KEY"
   ```

6. **Iniciar el servidor de desarrollo**
   ```bash
   ng serve
   ```
   La aplicación estará disponible en `http://localhost:4200`

---

## Estructura del Proyecto

```
ALED2025/
├── src/
│   ├── app/
│   │   ├── admin/              # Panel de administración
│   │   ├── auth/               # Autenticación
│   │   ├── carrito/            # Carrito de compras
│   │   ├── tienda/             # Catálogo de productos
│   │   ├── perfil-usuario/     # Perfil del usuario
│   │   └── services/           # Servicios compartidos
│   └── styles.css              # Estilos globales
├── functions/                  # Firebase Functions (backend)
│   └── src/
│       └── index.ts           # Funciones de Mercado Pago
└── firebase.json              # Configuración de Firebase
```

---

## Funcionalidades Implementadas

### Para Usuarios
- **Registro e inicio de sesión**
- **Navegación por catálogo de productos**
- **Agregar/eliminar productos del carrito**
- **Seleccionar método de entrega** (envío o retiro)
- **Completar datos de envío** (guardados para futuras compras)
- **Simulador de tarjeta virtual** - Interfaz realista de tarjeta de crédito
- **Pagar con Mercado Pago** - Integración completa de pagos
- **Ver y editar Perfil**

### Para Administradores
- **CRUD completo de productos**
- **Gestión de usuarios**
- **Cambiar roles de usuarios**
- **Personalización del sitio**
- **Ver estadísticas** (futuro)

---

## Sistema de Tarjeta Virtual

Una de las funcionalidades más innovadoras del proyecto es el **simulador de tarjeta de crédito virtual** que desarrollamos:

### Características del Simulador
- **Interfaz realista** - Diseño que simula una tarjeta de crédito física
- **Validación en tiempo real** - Verificación de números de tarjeta mientras el usuario escribe
- **Animaciones fluidas** - Transiciones suaves al voltear la tarjeta
- **Campos interactivos** - Nombre, número, fecha de vencimiento y CVV
- **Integración con Mercado Pago** - Los datos se envían de forma segura para el procesamiento

### Tecnologías Utilizadas
- **CSS3 Animations** - Para las transiciones y efectos visuales
- **Angular Reactive Forms** - Validación y manejo de formularios
- **Algoritmo de Luhn** - Validación matemática de números de tarjeta
- **Responsive Design** - Adaptable a diferentes tamaños de pantalla

---

## Seguridad Implementada

- **Hash de contraseñas** con bcrypt (10 rondas)
- **Validación de datos** en frontend y backend
- **Guards de Angular** para proteger rutas
- **Verificación de roles** en el backend
- **CORS** configurado correctamente
- **Validación de webhooks** con HMAC-SHA256
- **Sanitización de inputs** para prevenir inyección

---

## Despliegue

### Frontend (Firebase Hosting)
```bash
ng build --configuration production
firebase deploy --only hosting
```

### Backend (Firebase Functions)
```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## Documentación Adicional

- **Código comentado**: Todo el código está comentado en español
- **Arquitectura**: Ver diagrama en la documentación
- **Flujo de compra**: Documentado paso a paso
- **API de Mercado Pago**: Integración completa

---

## Aprendizajes del Proyecto

Durante el desarrollo aprendimos y aplicamos:

1. **Arquitectura moderna** - Separación frontend/backend
2. **Programación reactiva** - RxJS y Signals
3. **Integración de APIs** - Mercado Pago
4. **Seguridad** - Hash, validación, CORS
5. **Base de datos NoSQL** - Firestore en tiempo real
6. **Serverless** - Firebase Functions
7. **TypeScript** - Type safety y mejores prácticas
8. **Git** - Control de versiones y Trabajo en equipo

---

## Mejoras Futuras

- [ ] Historial de compras del usuario
- [ ] Sistema de búsqueda y filtros avanzados
- [ ] **Análisis automático con IA** (Gemini AI) - En desarrollo
- [ ] **Sistema de reseñas y calificaciones** - Planificado
- [ ] Notificaciones por email
- [ ] Dashboard de Ventas para administradores
- [ ] Múltiples imágenes por producto
- [ ] Cupones de descuento
- [ ] Chat de soporte en vivo

### Funcionalidades de IA (En Desarrollo)
- **Análisis automático de productos**: Generación de nombres y descripciones
- **Reconocimiento de imágenes**: Categorización automática
- **Asistente de contenido**: Mejora de descripciones de productos

---

## Contacto

**Julian Cancelo**
- GitHub: [@julianmcancelo](https://github.com/julianmcancelo)

**Nicolas Otero**
- GitHub: [@nicolasotero](https://github.com/nicolasotero)

---

## Licencia

Este proyecto fue desarrollado con fines académicos para la materia ALED III - T.A.S.

**© 2025 - Cancelo Julian & Nicolas Otero**

---

⭐ Si te gustó el proyecto, dejanos una estrella en GitHub!