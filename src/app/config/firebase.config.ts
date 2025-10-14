/**
 * ============================================================================
 * CONFIGURACIÓN DE FIREBASE PARA ALED2025
 * ============================================================================
 * 
 * Esta configuración conecta la aplicación Angular con Firebase/Firestore.
 * 
 * IMPORTANTE: 
 * - Estos son valores de ejemplo para desarrollo
 * - Para producción, reemplaza con tu configuración real de Firebase
 * - Nunca subas las credenciales reales a repositorios públicos
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

export const firebaseConfig = {
  // API Key para autenticación con Firebase
  apiKey: "AIzaSyAYof5X_SayXySktaeT1NZjfcWKBmqbxqM",
  
  // Dominio de autenticación del proyecto
  authDomain: "aled2025-5be25.firebaseapp.com",
  
  // ID único del proyecto Firebase
  projectId: "aled2025-5be25",
  
  // Bucket de almacenamiento para archivos
  storageBucket: "aled2025-5be25.firebasestorage.app",
  
  // ID del remitente para mensajería
  messagingSenderId: "773634182293",
  
  // ID único de la aplicación web
  appId: "1:773634182293:web:a91a4778c57065faca1f9c",
  
  // ID de medición para Analytics (opcional)
  measurementId: "G-90LCBTBJLJ"
};

/**
 * PASOS PARA CONFIGURAR TU PROYECTO FIREBASE:
 * 
 * 1. Ve a https://console.firebase.google.com/
 * 2. Crea un nuevo proyecto llamado "aled2025-ecommerce"
 * 3. Habilita Firestore Database
 * 4. En "Configuración del proyecto" > "General"
 * 5. Agrega una app web y copia la configuración
 * 6. Reemplaza los valores arriba con tu configuración real
 * 
 * ⚠️ IMPORTANTE - REGLAS DE FIRESTORE:
 * Ve a Firestore Database > Reglas y usa estas reglas para desarrollo:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Permitir lectura y escritura a todos los documentos (SOLO PARA DESARROLLO)
 *     match /{document=**} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
 * 
 * COLECCIONES NECESARIAS EN FIRESTORE:
 * - usuarios (para autenticación y perfiles)
 * - productos (catálogo de productos)
 * - categorias (categorías de productos)
 * - pedidos (órdenes de compra)
 * - novedades (banners y ofertas)
 * 
 * 🔧 VERIFICACIÓN DE COLECCIONES:
 * Si las colecciones no existen, se crearán automáticamente
 * cuando agregues el primer documento a cada una.
 */

/**
 * DATOS DE EJEMPLO PARA INICIALIZAR FIRESTORE:
 * Puedes usar estos datos para crear documentos de prueba
 */
export const DATOS_EJEMPLO = {
  // Ejemplo de categoría
  categoria: {
    nombre: 'Electrónicos',
    descripcion: 'Productos electrónicos y tecnología',
    activo: true,
    fechaCreacion: new Date()
  },
  
  // Ejemplo de novedad
  novedad: {
    titulo: 'Oferta Especial',
    descripcion: 'Descuentos en productos seleccionados',
    imagenUrl: 'https://via.placeholder.com/400x200/0077b6/ffffff?text=Oferta+Especial',
    enlaceUrl: '/productos',
    fechaCreacion: new Date()
  }
};