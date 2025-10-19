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

Desarrollamos un **sistema completo de e-commerce** desde cero, aplicando todo lo aprendido en la materia. La aplicación permite a los usuarios navegar por un catálogo de productos, agregarlos al carrito y realizar pagos reales mediante integración con plataforma de pagos.

### Características Principales

- **Catálogo de productos** con búsqueda y filtros
- **Carrito de compras** con estado reactivo (Angular Signals)
- **Sistema de tarjeta virtual** - Simulador de tarjeta de crédito integrado
- **Integración real con plataforma de pagos** (sandbox)
- **Checkout dedicado** con selección de método de pago
- **Autenticación personalizada** con bcrypt
- **Panel de administración** completo (CRUD productos, usuarios)
- **Perfil de usuario mejorado** con múltiples secciones
- **Historial de compras** con diseño moderno
- **Diseño UI/UX profesional** siguiendo mejores prácticas
- **Base de datos en tiempo real** con Firebase Firestore

---

## Tecnologías Utilizadas

### Frontend
- **Angular 20.3** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Bootstrap 5** - Componentes UI
- **Tailwind CSS** - Framework de estilos
- **Angular Signals** - Sistema reactivo moderno
- **SweetAlert2** - Modales y alertas
- **RxJS** - Programación reactiva

### Backend
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Functions** - Backend serverless
- **Node.js** - Runtime de JavaScript

### Integración de Pagos
- **SDK de pagos** - Procesamiento de pagos reales

### Seguridad
- **bcryptjs** - Hash de contraseñas (10 rondas)
- **Guards de Angular** - Protección de rutas
- **CORS** - Seguridad de peticiones

---

## Funcionalidades Implementadas

### Para Usuarios
- **Registro e inicio de sesión** con diseño moderno
- **Navegación por catálogo de productos**
- **Carrito inteligente** con sugerencias de compra para usuarios no autenticados
- **Simulador de tarjeta virtual** con interfaz realista
- **Proceso de pago completo** con plataforma de pagos y tarjeta virtual
- **Checkout dedicado** con selección de método de pago
- **Perfil completo** con 5 secciones: Datos personales, Entrega, Tarjeta virtual, Seguridad e Historial
- **Historial de compras** con estadísticas y diseño moderno
- **Historial de transacciones** de tarjeta virtual

### Para Administradores
- **CRUD completo de productos**
- **Gestión de usuarios y roles**
- **Panel de tarjetas virtuales** (modificar saldos, estados)
- **Personalización de tarjetas** (logos, colores, tipos)
- **Gestión de categorías**
- **Configuración del sitio**

---

## Diseño UI/UX Moderno

Implementamos un diseño profesional siguiendo las mejores prácticas de UX:

### Características del Diseño
- **Formularios limpios** - Header celeste + formulario blanco
- **Cards minimalistas** - Bordes sutiles, iconos circulares, hover effects
- **Estadísticas visuales** - Iconos de colores con información clara
- **Estados de pedidos** - Badges con colores específicos por estado
- **Layout responsive** - Grid adaptable a todos los dispositivos
- **Animaciones suaves** - Transiciones CSS para mejor experiencia

### Componentes Rediseñados
- **Formulario de registro** - Diseño limpio y moderno
- **Historial de compras** - Cards con badges de estado
- **Perfil de usuario** - Info-grid con iconos circulares
- **Sección de seguridad** - Opciones con estado de desarrollo
- **Historial de transacciones** - Lista con iconos de colores
- **Carrito vacío** - Sugerencias según autenticación

---

## Sistema de Tarjeta Virtual

Una de las funcionalidades más innovadoras del proyecto:

### Características del Simulador
- **Interfaz realista** - Diseño que simula una tarjeta de crédito física
- **Validación en tiempo real** - Algoritmo de Luhn para números de tarjeta
- **Animaciones fluidas** - Transiciones CSS3 al voltear la tarjeta
- **Personalización completa** - Logos, colores, tipos (Visa, Mastercard)
- **Panel administrativo** - Gestión de saldos y estados por administradores

### Tecnologías del Simulador
- **CSS3 Animations** - Efectos visuales y transiciones
- **Angular Reactive Forms** - Validación y manejo de formularios
- **Algoritmo de Luhn** - Validación matemática de números
- **Responsive Design** - Adaptable a todos los dispositivos

---

## Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm
- Cuenta de Firebase
- Cuenta en plataforma de pagos (para procesamiento)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/julianmcancelo/ALED2025.git
   cd ALED2025
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crear proyecto en Firebase Console
   - Habilitar Firestore Database
   - Copiar credenciales en `src/app/app.config.ts`

4. **Iniciar desarrollo**
   ```bash
   ng serve
   ```
   Aplicación disponible en `http://localhost:4200`

---

## Estructura del Proyecto

```
ALED2025/
├── src/app/
│   ├── admin/              # Panel de administración
│   ├── auth/               # Sistema de autenticación
│   ├── carrito/            # Carrito de compras
│   ├── tienda/             # Catálogo de productos
│   ├── perfil-usuario/     # Perfil del usuario
│   ├── servicios/          # Servicios compartidos
│   └── shared/             # Componentes reutilizables
├── firebase.json           # Configuración Firebase
└── package.json           # Dependencias
```

---

## Seguridad Implementada

- **Hash de contraseñas** con bcrypt (10 rondas)
- **Validación de datos** en frontend y backend
- **Guards de Angular** para proteger rutas
- **Verificación de roles** (admin/usuario)
- **CORS** configurado correctamente
- **Sanitización de inputs** para prevenir inyecciones

---

## Despliegue

### Build de Producción
```bash
ng build --configuration production
```

### Deploy a Firebase
```bash
firebase deploy --only hosting
```

---

## Algoritmos y Estructuras de Datos Aplicadas

### Estructuras de Datos
- **Arrays**: Gestión de listas (productos, usuarios, pedidos)
- **Objects**: Modelos de datos (Producto, Usuario, Pedido)
- **Maps**: Almacenamiento eficiente por ID
- **Signals**: Estado reactivo granular

### Algoritmos Implementados
- **Hash criptográfico** (bcrypt) para seguridad
- **Búsqueda lineal** O(n) para filtros de productos
- **Ordenamiento** O(n log n) para listados
- **Validación Luhn** O(n) para números de tarjeta
- **Reducción** O(n) para cálculos de totales

---

## Aprendizajes del Proyecto

Durante el desarrollo aplicamos:

1. **Arquitectura moderna** - Separación frontend/backend
2. **Programación reactiva** - RxJS y Signals
3. **Integración de APIs** - Plataforma de pagos
4. **Diseño UI/UX** - Inspirado en mejores prácticas de la industria
5. **Base de datos NoSQL** - Base de datos en tiempo real
6. **TypeScript** - Type safety y mejores prácticas
7. **Componentización** - Reutilización y modularidad
8. **Trabajo en equipo** - Git y control de versiones

---

## Contacto

**Julian Cancelo**
- GitHub: [@julianmcancelo](https://github.com/julianmcancelo)

**Nicolas Otero**
- GitHub: [@nicolasotero](https://github.com/Nicootero2023)

---

## Licencia

Este proyecto fue desarrollado con fines académicos para la materia ALED III - T.A.S.

**© 2025 - Cancelo Julian & Nicolas Otero**

---

⭐ Si te gustó el proyecto, dejanos una estrella en GitHub!
