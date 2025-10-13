// Configuración de Firebase para ALED2025
// Proyecto: aled2025-5be25

export const firebaseConfig = {
  apiKey: 'AIzaSyAYof5X_SayXySktaeT1NZjfcWKBmqbxqM',
  authDomain: 'aled2025-5be25.firebaseapp.com',
  projectId: 'aled2025-5be25',
  storageBucket: 'aled2025-5be25.firebasestorage.app',
  messagingSenderId: '773634182293',
  appId: '1:773634182293:web:a91a4778c57065faca1f9c',
  measurementId: 'G-90LCBTBJLJ',
};

// Nombres de las colecciones de Firestore
export const COLLECTIONS = {
  PRODUCTOS: 'productos',
  CATEGORIAS: 'categorias',
  USUARIOS: 'usuarios',
  PEDIDOS: 'pedidos',
  CONFIGURACION: 'configuracion',
  NOVEDADES: 'novedades'
} as const;
