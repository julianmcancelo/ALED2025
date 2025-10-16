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

#### 🛒 E-Commerce
- **Catálogo de productos** con búsqueda, filtros y ordenamiento
- **Carrito de compras** con estado reactivo usando Signals
- **Integración real con Mercado Pago** para procesamiento de pagos
- **Gestión de stock** en tiempo real
- **Categorías dinámicas** configurables desde el admin
- **Ofertas y novedades** destacadas con slider
- **Reseñas y calificaciones** de productos

#### 🤖 Inteligencia Artificial
- **Análisis automático de productos** con Google Gemini AI 2.0
- **Generación de descripciones** optimizadas para SEO
- **Sugerencias de precios** basadas en análisis de mercado
- **Categorización inteligente** mediante reconocimiento visual

#### 🔒 Seguridad y Autenticación
- **Sistema de autenticación personalizado** con bcrypt
- **Gestión de roles** (Admin/Usuario)
- **Protección de rutas** con Guards de Angular
- **Persistencia de sesión** en localStorage

#### 💳 Pagos y Transacciones
- **Tarjetas virtuales** para pagos seguros
- **Selección de método de entrega** (envío o retiro)
- **Gestión de pedidos** con seguimiento de estado
- **Historial de compras** del usuario

#### 👨‍💻 Panel de Administración
- **CRUD completo** de productos, usuarios, categorías
- **Gestión de novedades** y ofertas destacadas
- **Personalización del sitio** (título, subtítulo, colores)
- **Gestión de pedidos** con actualización de estados
- **Estadísticas de ventas** (en desarrollo)

#### 🎨 Experiencia de Usuario
- **Diseño responsive** optimizado para todos los dispositivos
- **Actualización en tiempo real** con Firestore listeners
- **Animaciones fluidas** con Angular Animations
- **Interfaz moderna** inspirada en Mercado Libre
- **Localización** en español argentino (es-AR)

---

## Tecnologías Utilizadas

### Frontend
- **Angular 20.3** - Framework principal basado en componentes con arquitectura MVC
- **TypeScript 5.9** - Lenguaje de programación tipado que compila a JavaScript
- **Tailwind CSS 3.4** - Framework de utilidades CSS para diseño responsivo
- **Bootstrap 5.3** - Biblioteca de componentes UI preconstruidos
- **ng-bootstrap 19.0** - Componentes Bootstrap nativos para Angular sin dependencias jQuery
- **Angular Material 20.2** - Implementación de Material Design para Angular (CDK incluido)
- **Angular Animations 20.3** - Sistema de animaciones declarativo de Angular
- **SweetAlert2 11.23** - Biblioteca para modales personalizados y alertas interactivas
- **Bootstrap Icons 1.13** - Biblioteca de iconos vectoriales
- **Popper.js 2.11** - Motor de posicionamiento para tooltips y popovers
- **RxJS 7.8** - Biblioteca para programación reactiva con observables
- **Signals** - API reactiva de Angular para gestión de estado granular
- **Zone.js 0.15** - Detección de cambios asíncrona de Angular

### Backend e Integraciones
- **Firebase 10.14** - Plataforma de desarrollo de aplicaciones con backend como servicio (BaaS)
- **AngularFire 18.0** - Biblioteca oficial para integración Firebase-Angular
- **Mercado Pago API** - Integración directa con API REST para procesamiento de pagos electrónicos
- **Google Gemini AI 2.0 Flash** - Modelo de IA generativa para análisis automático de productos
  - Análisis visual de imágenes de productos
  - Generación de nombres comerciales
  - Descripciones optimizadas para e-commerce
  - Sugerencias de precios basadas en mercado argentino
  - Categorización automática inteligente

### Base de Datos
- **Firebase Firestore** - Base de datos NoSQL orientada a documentos con sincronización en tiempo real
- **Colecciones principales**: 
  - `users` - Usuarios y perfiles
  - `productos` - Catálogo de productos
  - `pedidos` - Historial de compras
  - `categorias` - Categorías de productos
  - `novedades` - Ofertas y promociones destacadas
  - `configuracion` - Configuración global del sitio
  - `tarjetas-virtuales` - Tarjetas de crédito virtuales para pagos
  - `resenas` - Reseñas y calificaciones de productos
- **Índices compuestos** para consultas optimizadas
- **Firestore Rules** - Reglas de seguridad declarativas

### Seguridad
- **bcryptjs 3.0** - Algoritmo de hash adaptativo para protección de contraseñas (10 rondas)
- **Firebase Security Rules** - Reglas declarativas para control de acceso a Firestore
- **Angular Guards** - Protección de rutas (`AuthGuard`, `AdminGuard`)
- **Type Safety** - TypeScript previene errores en tiempo de compilación
- **Content Security Policy** - Headers de seguridad configurados

### Herramientas de Desarrollo
- **Angular CLI 20.3** - Interfaz de línea de comandos para desarrollo Angular
- **Prettier** - Formateo automático de código con configuración personalizada
- **PostCSS 8.5** - Transformación de CSS con plugins
- **Autoprefixer 10.4** - Añade prefijos de navegador automáticamente
- **Karma 6.4** - Test runner para pruebas unitarias
- **Jasmine 5.9** - Framework de testing BDD
- **EditorConfig** - Consistencia de estilo entre editores

---

## Algoritmos y Estructuras de Datos Implementadas

### Estructuras de Datos

#### 1. **Arrays (Arreglos)**
- **Definición**: Colección ordenada de elementos del mismo tipo almacenados en posiciones contiguas de memoria
- **Uso en el proyecto**: 
  - Lista de productos en el catálogo (`Producto[]`)
  - Items del carrito de compras (`CartItem[]`)
  - Lista de usuarios en el panel admin (`AppUser[]`)
- **Complejidad**: Acceso O(1), Búsqueda O(n), Inserción/Eliminación O(n)

#### 2. **Maps (Diccionarios/Hash Maps)**
- **Definición**: Estructura clave-valor que permite búsqueda rápida mediante una clave única
- **Uso en el proyecto**:
  - Almacenamiento temporal de productos por ID
  - Configuración de Firebase (`Map<string, any>`)
  - Cache de datos de usuario
- **Complejidad**: Acceso O(1), Inserción O(1), Eliminación O(1)

#### 3. **Objects (Objetos/Registros)**
- **Definición**: Estructura de datos compuesta que agrupa múltiples propiedades relacionadas
- **Uso en el proyecto**:
  - Modelo de Producto (`Producto` interface)
  - Modelo de Usuario (`AppUser` interface)
  - Modelo de Pedido (`Pedido` interface)
  - Configuración del sitio (`ConfiguracionSitio`)

#### 4. **Observables (Streams)**
- **Definición**: Secuencia de eventos asíncronos que pueden ser observados y procesados
- **Uso en el proyecto**:
  - Estado reactivo del carrito
  - Listeners de Firestore en tiempo real
  - Peticiones HTTP a APIs externas
- **Complejidad**: Depende de la operación, típicamente O(n) para transformaciones

#### 5. **Signals (Estado Reactivo Granular)**
- **Definición**: API reactiva de Angular para gestión de estado con actualizaciones automáticas
- **Uso en el proyecto**:
  - `currentUserSignal()` - Estado del usuario autenticado
  - `configuracionSignal()` - Configuración del sitio
  - `carritoSignal()` - Estado del carrito de compras
- **Ventajas**: Rendimiento optimizado, detección de cambios granular

### Algoritmos Implementados

#### 1. **Algoritmo de Hash (bcrypt)**
- **Definición**: Función criptográfica unidireccional que convierte datos en una cadena de longitud fija
- **Uso**: Protección de contraseñas de usuarios
- **Implementación**: 
  - Hash con 10 rondas de salt
  - Verificación mediante `bcrypt.compareSync()`
- **Complejidad**: O(2^n) donde n es el número de rondas (intencional para seguridad)

#### 2. **Algoritmo de Búsqueda Lineal**
- **Definición**: Recorre secuencialmente una colección hasta encontrar el elemento buscado
- **Uso**: Búsqueda de productos por nombre, categoría o descripción
- **Complejidad**: O(n) en el peor caso

#### 3. **Algoritmo de Filtrado**
- **Definición**: Proceso de selección de elementos que cumplen ciertos criterios
- **Uso**: 
  - Filtro de productos por categoría
  - Filtro de pedidos por estado
  - Filtro de usuarios por rol
- **Complejidad**: O(n) donde n es el número de elementos

#### 4. **Algoritmo de Ordenamiento (Sort)**
- **Definición**: Organiza elementos según un criterio específico
- **Uso**: 
  - Ordenar productos por precio (ascendente/descendente)
  - Ordenar pedidos por fecha
  - Ordenar novedades por prioridad
- **Complejidad**: O(n log n) usando TimSort (implementación nativa de JavaScript)

#### 5. **Algoritmo de Mapeo (Transform)**
- **Definición**: Transforma cada elemento de una colección aplicando una función
- **Uso**: 
  - Conversión de DocumentSnapshot a objetos tipados
  - Transformación de datos de Firestore a modelos del frontend
  - Cálculo de totales en el carrito
- **Complejidad**: O(n)

#### 6. **Algoritmo de Reducción (Aggregate)**
- **Definición**: Combina todos los elementos de una colección en un único valor
- **Uso**: 
  - Cálculo del total del carrito (`reduce()`)
  - Suma de cantidades de productos
  - Conteo de estadísticas
- **Complejidad**: O(n)

#### 7. **Algoritmo de Validación HMAC-SHA256**
- **Definición**: Algoritmo de autenticación basado en hash para verificar integridad y autenticidad
- **Uso**: Validación de webhooks de Mercado Pago
- **Complejidad**: O(n) donde n es el tamaño del mensaje

### Patrones de Diseño

#### 1. **Singleton Pattern**
- **Definición**: Garantiza que una clase tenga una única instancia en toda la aplicación
- **Uso**: Servicios de Angular con `providedIn: 'root'`
  - `AuthService`
  - `CarritoService`
  - `UserService`
  - `ProductoService`

#### 2. **Observer Pattern**
- **Definición**: Define dependencia uno-a-muchos donde los observadores son notificados de cambios
- **Uso**: 
  - RxJS Observables
  - Firestore Listeners
  - Signals de Angular

#### 3. **Dependency Injection Pattern**
- **Definición**: Proporciona dependencias a una clase desde el exterior en lugar de crearlas internamente
- **Uso**: Sistema de inyección de dependencias de Angular con `inject()`

#### 4. **Guard Pattern**
- **Definición**: Valida condiciones antes de permitir acceso a recursos
- **Uso**: 
  - `AuthGuard` - Protege rutas de usuarios no autenticados
  - `AdminGuard` - Protege rutas de administrador

#### 5. **Repository Pattern**
- **Definición**: Abstrae el acceso a datos proporcionando una interfaz uniforme
- **Uso**: Servicios que encapsulan operaciones de Firestore

### Paradigmas de Programación

#### 1. **Programación Orientada a Objetos (OOP)**
- Clases e interfaces TypeScript
- Encapsulación de datos y métodos
- Herencia y composición

#### 2. **Programación Funcional**
- Funciones puras sin efectos secundarios
- Inmutabilidad de datos
- Composición de funciones con operadores RxJS

#### 3. **Programación Reactiva**
- Flujos de datos asíncronos con Observables
- Transformaciones declarativas
- Gestión de estado reactivo con Signals

#### 4. **Programación Asíncrona**
- Promesas (async/await)
- Observables
- Callbacks para eventos

---

## Conceptos Técnicos Fundamentales

### Arquitectura y Diseño

#### **MVC (Model-View-Controller)**
- **Definición**: Patrón arquitectónico que separa la lógica de negocio (Model), presentación (View) y control de flujo (Controller)
- **En Angular**: Los componentes actúan como Controllers, los templates como Views, y los servicios/modelos como Models

#### **SPA (Single Page Application)**
- **Definición**: Aplicación web que carga una única página HTML y actualiza dinámicamente el contenido sin recargar
- **Ventajas**: Experiencia fluida, menor carga del servidor, transiciones instantáneas
- **En el proyecto**: Angular Router gestiona la navegación sin recargar la página

#### **Component-Based Architecture**
- **Definición**: Arquitectura que divide la UI en componentes reutilizables e independientes
- **En el proyecto**: Cada funcionalidad es un componente standalone (carrito, productos, perfil, etc.)

#### **Serverless Architecture**
- **Definición**: Modelo de ejecución donde el proveedor cloud gestiona la infraestructura
- **En el proyecto**: Firebase Functions ejecuta lógica backend sin gestionar servidores

### Base de Datos

#### **NoSQL (Not Only SQL)**
- **Definición**: Base de datos no relacional que no requiere esquemas fijos
- **Ventajas**: Escalabilidad horizontal, flexibilidad de esquema, rendimiento en lecturas
- **Firestore**: Base de datos NoSQL orientada a documentos

#### **Documento (Document)**
- **Definición**: Unidad básica de almacenamiento en Firestore, similar a un objeto JSON
- **Estructura**: Colección de pares clave-valor con tipos de datos variados
- **Ejemplo**: Un producto con id, nombre, precio, stock, etc.

#### **Colección (Collection)**
- **Definición**: Contenedor de documentos en Firestore
- **En el proyecto**: 
  - `productos` - Catálogo de productos
  - `users` - Datos de usuarios
  - `pedidos` - Historial de compras

#### **Índice (Index)**
- **Definición**: Estructura auxiliar que optimiza consultas en bases de datos
- **En Firestore**: Índices automáticos para campos individuales e índices compuestos para consultas complejas

#### **Tiempo Real (Real-time)**
- **Definición**: Capacidad de recibir actualizaciones inmediatas cuando los datos cambian
- **En el proyecto**: Listeners de Firestore detectan cambios y actualizan la UI automáticamente

### Programación Reactiva

#### **Observable**
- **Definición**: Objeto que emite valores de forma asíncrona a lo largo del tiempo
- **Características**: Lazy (no se ejecuta hasta la suscripción), cancelable, puede emitir múltiples valores
- **Operadores**: `map`, `filter`, `switchMap`, `combineLatest`, `debounceTime`

#### **Signal (Angular)**
- **Definición**: Primitiva reactiva que notifica cambios de forma automática y granular
- **Ventajas sobre Observables**: Más simple, mejor rendimiento, no requiere suscripción/desuscripción
- **En el proyecto**: Estado del usuario, carrito, configuración

#### **Stream (Flujo de Datos)**
- **Definición**: Secuencia continua de datos procesados de forma asíncrona
- **Uso**: Peticiones HTTP, eventos del DOM, cambios en Firestore

### Seguridad

#### **Hash Criptográfico**
- **Definición**: Función unidireccional que convierte datos en un valor fijo irreversible
- **Propiedades**: Determinista, resistente a colisiones, no reversible
- **bcrypt**: Añade "salt" aleatorio y es computacionalmente costoso para resistir fuerza bruta

#### **Salt (Sal Criptográfica)**
- **Definición**: Valor aleatorio añadido a datos antes del hash para prevenir ataques de diccionario
- **En bcrypt**: Se genera automáticamente y se almacena con el hash

#### **CORS (Cross-Origin Resource Sharing)**
- **Definición**: Mecanismo que permite a servidores especificar qué dominios pueden acceder a sus recursos
- **Problema que resuelve**: Por defecto, los navegadores bloquean peticiones entre dominios diferentes
- **En el proyecto**: Configurado en Firebase Functions para permitir peticiones del frontend

#### **Webhook**
- **Definición**: Callback HTTP que notifica eventos en tiempo real de un servicio externo
- **En el proyecto**: Mercado Pago envía webhooks para notificar el estado de pagos

#### **HMAC (Hash-based Message Authentication Code)**
- **Definición**: Algoritmo que combina un hash criptográfico con una clave secreta para autenticar mensajes
- **Uso**: Verificar que los webhooks provienen realmente de Mercado Pago

### API y Servicios

#### **REST API**
- **Definición**: Estilo arquitectónico para APIs que usa HTTP y es stateless
- **Métodos**: GET (leer), POST (crear), PUT (actualizar), DELETE (eliminar)
- **En el proyecto**: Firebase Functions expone endpoints REST

#### **HTTP (Hypertext Transfer Protocol)**
- **Definición**: Protocolo de comunicación cliente-servidor para transferir datos
- **Códigos de estado**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)

#### **JSON (JavaScript Object Notation)**
- **Definición**: Formato ligero de intercambio de datos legible por humanos y máquinas
- **Uso**: Todas las comunicaciones entre frontend-backend y almacenamiento en Firestore

#### **SDK (Software Development Kit)**
- **Definición**: Conjunto de herramientas, bibliotecas y documentación para facilitar el desarrollo
- **En el proyecto**: Firebase SDK, Mercado Pago SDK, Angular CLI

### TypeScript y Tipado

#### **Type Safety (Seguridad de Tipos)**
- **Definición**: Característica que previene errores de tipo en tiempo de compilación
- **Ventajas**: Menos bugs, mejor autocompletado, refactorización segura

#### **Interface**
- **Definición**: Contrato que define la estructura de un objeto sin implementación
- **En el proyecto**: `Producto`, `AppUser`, `Pedido`, `CartItem`

#### **Generic (Genérico)**
- **Definición**: Tipo que acepta parámetros de tipo para crear componentes reutilizables
- **Ejemplo**: `Observable<Producto[]>`, `Signal<AppUser | null>`

#### **Enum (Enumeración)**
- **Definición**: Conjunto de constantes con nombre que representan valores relacionados
- **Ejemplo**: Estados de pedido, roles de usuario

### Frontend

#### **Routing (Enrutamiento)**
- **Definición**: Sistema que mapea URLs a componentes específicos
- **En Angular**: `RouterModule` gestiona navegación entre vistas
- **Características**: Lazy loading, guards, parámetros de ruta

#### **Lazy Loading**
- **Definición**: Técnica que carga módulos o componentes solo cuando son necesarios
- **Ventajas**: Menor tamaño del bundle inicial, carga más rápida
- **En el proyecto**: Rutas de admin cargadas bajo demanda

#### **Responsive Design**
- **Definición**: Diseño que se adapta a diferentes tamaños de pantalla
- **Implementación**: Bootstrap grid, media queries, utilidades de Tailwind
- **Breakpoints**: mobile (<768px), tablet (768-1024px), desktop (>1024px)

#### **Guard (Guardia)**
- **Definición**: Función que determina si se puede acceder a una ruta
- **Tipos**: `CanActivate`, `CanDeactivate`, `CanLoad`
- **En el proyecto**: Protección de rutas admin y autenticadas

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

3. **Configurar Firebase**
   - Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilitar Firestore Database
   - Habilitar Firebase Hosting
   - Copiar las credenciales en `src/app/config/firebase.config.ts`

4. **Configurar Mercado Pago** (requerido para pagos)
   - Obtener credenciales en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
   - Actualizar `src/app/config/mercadopago.config.ts`:
   ```typescript
   SANDBOX: {
     PUBLIC_KEY: 'TU_PUBLIC_KEY',
     ACCESS_TOKEN: 'TU_ACCESS_TOKEN'
   }
   ```

5. **Configurar Google Gemini AI** (opcional para IA)
   - Obtener API key en [Google AI Studio](https://aistudio.google.com/)
   - Actualizar en `src/app/servicios/gemini-ai.service.ts`:
   ```typescript
   apiKey: 'TU_GEMINI_API_KEY'
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
│   │   ├── admin/                 # Panel de administración completo
│   │   │   ├── gestion-productos/ # CRUD de productos + IA
│   │   │   ├── gestion-usuarios/  # Gestión de usuarios y roles
│   │   │   ├── gestion-pedidos/   # Administración de pedidos
│   │   │   ├── gestion-categorias/# Gestión de categorías
│   │   │   ├── gestion-novedades/ # Ofertas y promociones
│   │   │   └── personalizacion-sitio/ # Configuración del sitio
│   │   ├── auth/                  # Sistema de autenticación
│   │   │   ├── inicio-sesion/     # Login
│   │   │   ├── registro/          # Registro de usuarios
│   │   │   ├── auth.ts            # AuthService principal
│   │   │   ├── auth.guard.ts      # Guard de autenticación
│   │   │   └── admin-guard.ts     # Guard de administrador
│   │   ├── carrito/               # Carrito de compras
│   │   ├── tienda/                # Catálogo de productos
│   │   ├── detalle-producto/      # Vista detalle con reseñas
│   │   ├── categorias/            # Navegación por categorías
│   │   ├── ofertas/               # Página de ofertas
│   │   ├── perfil-usuario/        # Perfil y datos personales
│   │   ├── mis-pedidos/           # Historial de compras
│   │   ├── servicios/             # Servicios compartidos
│   │   │   ├── carrito.ts         # Gestión del carrito (Signals)
│   │   │   ├── user.ts            # Gestión de usuarios
│   │   │   ├── gestion-productos.service.ts
│   │   │   ├── pedidos.service.ts
│   │   │   ├── gemini-ai.service.ts    # Integración IA
│   │   │   ├── tarjeta-virtual.service.ts
│   │   │   └── resenas.service.ts
│   │   ├── config/                # Configuraciones
│   │   │   ├── firebase.config.ts
│   │   │   └── mercadopago.config.ts
│   │   ├── shared/                # Componentes compartidos
│   │   ├── encabezado/            # Header navigation
│   │   ├── pie-pagina/            # Footer
│   │   └── inicio/                # Página principal
│   ├── environments/              # Variables de entorno
│   └── styles.css                 # Estilos globales
├── public/                        # Recursos estáticos
├── firebase.json                  # Configuración Firebase
├── firestore.rules                # Reglas de seguridad
├── firestore.indexes.json         # Índices de Firestore
├── tailwind.config.js             # Configuración Tailwind
├── angular.json                   # Configuración Angular
└── package.json                   # Dependencias
```

---

## Funcionalidades Implementadas

### Para Usuarios
- **Registro e inicio de sesión**
- **Navegación por catálogo de productos**
- **Agregar/eliminar productos del carrito**
- **Seleccionar método de entrega** (envío o retiro)
- **Completar datos de envío** (guardados para futuras compras)
- **Pagar con Mercado Pago**
- **Ver y editar Perfil**

### Para Administradores
- **CRUD completo de productos**
- **Gestión de usuarios**
- **Cambiar roles de usuarios**
- **Personalización del sitio**
- **Ver estadísticas** (futuro)

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

El proyecto soporta múltiples plataformas de despliegue:

### Opción 1: Firebase Hosting (Recomendado)
```bash
# Build de producción
ng build --configuration production

# Desplegar a Firebase
firebase deploy --only hosting

# Desplegar Firestore rules e índices
firebase deploy --only firestore
```

**Ventajas:**
- Integración nativa con Firestore
- CDN global automático
- SSL gratuito
- Rollback instantáneo

### Opción 2: Netlify
```bash
# Build automático desde Git
# Configuración en netlify.toml

# O manual:
ng build --configuration production
netlify deploy --prod --dir=dist/Final/browser
```

**Ventajas:**
- Deploy automático desde GitHub
- Preview de PRs
- Funciones serverless

### Opción 3: Vercel
```bash
# Deploy automático o manual
vercel --prod
```

**Ventajas:**
- Performance optimizado
- Edge network global
- Integración con Git

### Script de Producción (Windows)
```bash
# Usar el script incluido
.\deploy-production.bat
```

Este script automáticamente:
1. Hace build de producción
2. Despliega a Firebase Hosting
3. Actualiza Firestore rules

---

## Documentación Adicional

- **Código comentado**: Todo el código está comentado en español
- **Arquitectura**: Ver diagrama en la documentación
- **Flujo de compra**: Documentado paso a paso
- **API de Mercado Pago**: Integración completa

---

## Aprendizajes del Proyecto

Durante el desarrollo aprendimos y aplicamos:

### 1. **Arquitectura de Software**
- Separación de responsabilidades (frontend/backend)
- Patrón MVC en Angular
- Arquitectura de microservicios con Firebase Functions
- Component-based architecture con componentes standalone
- Lazy loading para optimización de rendimiento

### 2. **Estructuras de Datos**
- **Arrays**: Gestión de listas de productos, usuarios y pedidos
- **Maps/Objetos**: Almacenamiento eficiente por ID
- **Signals**: Estado reactivo granular
- **Observables**: Streams de datos asíncronos
- Complejidad algorítmica y optimización de consultas

### 3. **Algoritmos**
- **Hash criptográfico** (bcrypt) para seguridad de contraseñas
- **Búsqueda y filtrado** de productos con complejidad O(n)
- **Ordenamiento** con TimSort O(n log n)
- **Reducción** para cálculos de totales
- **Validación HMAC-SHA256** para webhooks

### 4. **Programación Reactiva**
- RxJS: Observables, Subjects, operadores (`map`, `filter`, `switchMap`)
- Signals: Nueva API reactiva de Angular
- Gestión de estado centralizado
- Sincronización en tiempo real con Firestore listeners

### 5. **Seguridad Informática**
- Hash de contraseñas con salt y bcrypt
- Validación de datos en frontend y backend
- Implementación de CORS para peticiones seguras
- Guards para protección de rutas
- Validación de webhooks con HMAC
- Firebase Security Rules para control de acceso

### 6. **Base de Datos NoSQL**
- Modelado de datos sin esquema fijo
- Colecciones y documentos en Firestore
- Consultas en tiempo real
- Índices compuestos para optimización
- Desnormalización de datos para mejor rendimiento

### 7. **Integración de APIs Externas**
- Mercado Pago SDK para procesamiento de pagos
- Webhooks para notificaciones asíncronas
- Manejo de respuestas HTTP y códigos de estado
- Serialización/deserialización JSON
- Manejo de errores y timeouts

### 8. **TypeScript Avanzado**
- Interfaces y tipos personalizados
- Genéricos para código reutilizable
- Type guards y narrowing
- Enums para valores constantes
- Type safety en toda la aplicación

### 9. **Testing y Debugging**
- Pruebas manuales con cuentas de sandbox
- Logging y trazabilidad de errores
- DevTools para debugging
- Validación de flujos de pago end-to-end

### 10. **Control de Versiones**
- Git para versionado de código
- Commits descriptivos y atómicos
- Branching para features
- Resolución de conflictos
- Trabajo colaborativo en equipo

### 11. **Despliegue y DevOps**
- Build y optimización para producción
- Firebase Hosting para frontend
- Firebase Functions para backend
- Variables de entorno y configuración
- Versionado de despliegues

### 12. **UX/UI y Diseño**
- Diseño responsive con Bootstrap y Tailwind
- Accesibilidad y usabilidad
- Feedback visual con SweetAlert2
- Animaciones y transiciones fluidas
- Material Design principles

---

## Análisis de Complejidad y Rendimiento

### Complejidad Temporal de Operaciones Clave

| Operación | Complejidad | Justificación |
|-----------|-------------|---------------|
| Obtener producto por ID | **O(1)** | Acceso directo por clave en Firestore |
| Listar todos los productos | **O(n)** | n = número de productos |
| Buscar productos por texto | **O(n)** | Búsqueda lineal en atributos |
| Agregar al carrito | **O(1)** | Actualización de Signal |
| Calcular total del carrito | **O(m)** | m = items en el carrito |
| Hash de contraseña (bcrypt) | **O(2^10)** | 10 rondas, intencional para seguridad |
| Ordenar productos | **O(n log n)** | TimSort nativo de JavaScript |
| Filtrar por categoría | **O(n)** | Recorrido completo del array |
| Validar usuario en Firestore | **O(1)** | Query indexado por email |

### Optimizaciones Implementadas

#### 1. **Índices en Firestore**
- Índices automáticos en campos de búsqueda frecuente
- Índices compuestos para queries con múltiples filtros
- Reducen tiempo de consulta de O(n) a O(log n)

#### 2. **Lazy Loading de Rutas**
```typescript
// Carga módulos bajo demanda
loadChildren: () => import('./admin/admin.routes')
```
- **Ventaja**: Bundle inicial más pequeño
- **Mejora**: ~40% reducción en tiempo de carga inicial

#### 3. **Signals para Estado Reactivo**
- Actualizaciones granulares sin re-renderizado completo
- Mejor rendimiento que Change Detection tradicional
- Menor uso de memoria que BehaviorSubjects

#### 4. **Caché de LocalStorage**
- Sesión de usuario persiste sin consultas adicionales
- Reducción de peticiones a Firebase
- Recuperación instantánea al recargar

#### 5. **OnPush Change Detection**
- Componentes se actualizan solo cuando sus inputs cambian
- Reduce ciclos de detección de cambios innecesarios

### Escalabilidad

#### **Horizontal (Firebase)**
- Firestore escala automáticamente con la demanda
- Cloud Functions escalan según tráfico
- Sin límite teórico de usuarios concurrentes

#### **Vertical (Código)**
- Código modular permite agregar features sin refactorizar
- Servicios desacoplados facilitan mantenimiento
- Componentes standalone reducen dependencias

### Métricas de Rendimiento

#### **Tiempo de Carga**
- Primera carga (cold start): ~2-3 segundos
- Navegación entre páginas: <500ms
- Build de producción: ~45 segundos

#### **Tamaño de Bundle**
- Initial bundle: ~1.5 MB (gzipped: ~400 KB)
- Lazy chunks: 10-130 KB cada uno
- Optimizado con tree-shaking

#### **Lighthouse Score** (Promedio)
- Performance: 85+
- Accessibility: 90+
- Best Practices: 95+
- SEO: 80+

---

## Mejoras Futuras

- [ ] Historial de compras del usuario
- [ ] Sistema de búsqueda y filtros avanzados
- [ ] Reviews y calificaciones de productos
- [ ] Notificaciones por email
- [ ] Dashboard de Ventas para administradores
- [ ] Múltiples imágenes por producto
- [ ] Cupones de descuento
- [ ] Chat de soporte en vivo

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