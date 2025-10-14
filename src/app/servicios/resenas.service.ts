import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth';
import { ConfiguracionService } from './configuracion';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, query, orderBy, where, getDoc, setDoc } from '@angular/fire/firestore';

export interface Resena {
  id: string;
  productoId: string;
  usuarioId: string;
  usuarioNombre: string;
  calificacion: number; // 1-5 estrellas
  comentario: string;
  fechaCreacion: Date;
  verificada: boolean; // Si el usuario compró el producto
  util: number; // Votos de "útil"
  respuestaVendedor?: {
    mensaje: string;
    fecha: Date;
  };
}

export interface EstadisticasVendedor {
  nombre: string;
  reputacion: 'Nuevo' | 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'MercadoLíder';
  calificacionPromedio: number;
  totalVentas: number;
  totalResenas: number;
  fechaRegistro: Date;
  porcentajePositivas: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResenasService {
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private configuracionService = inject(ConfiguracionService);
  
  // Colecciones de Firestore
  private resenasCollection = collection(this.firestore, 'resenas');
  private vendedorCollection = collection(this.firestore, 'vendedor');
  
  constructor() {
    // Inicializar datos del vendedor si no existen
    this.inicializarVendedor();
    // Inicializar reseñas de ejemplo si no existen
    this.inicializarResenasEjemplo();
  }

  /**
   * Inicializa los datos del vendedor en Firestore
   */
  private async inicializarVendedor(): Promise<void> {
    try {
      const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
      const vendedorSnapshot = await getDoc(vendedorDoc);
      
      if (!vendedorSnapshot.exists()) {
        // Obtener el nombre de la tienda desde la configuración
        const configuracion = this.configuracionService.configuracionSignal();
        
        const estadisticasIniciales: EstadisticasVendedor = {
          nombre: configuracion.titulo,
          reputacion: 'MercadoLíder',
          calificacionPromedio: 4.8,
          totalVentas: 2847,
          totalResenas: 0, // Se calculará dinámicamente
          fechaRegistro: new Date('2020-03-15'),
          porcentajePositivas: 98.5
        };
        
        await setDoc(vendedorDoc, {
          ...estadisticasIniciales,
          fechaRegistro: estadisticasIniciales.fechaRegistro.toISOString()
        });
        
        console.log('✅ Datos del vendedor inicializados en Firestore con nombre:', configuracion.titulo);
      } else {
        // Actualizar el nombre si ha cambiado en la configuración
        await this.sincronizarNombreVendedor();
      }
    } catch (error) {
      console.error('❌ Error inicializando vendedor:', error);
    }
  }

  /**
   * Sincroniza el nombre del vendedor con la configuración
   */
  private async sincronizarNombreVendedor(): Promise<void> {
    try {
      const configuracion = this.configuracionService.configuracionSignal();
      const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
      
      await updateDoc(vendedorDoc, {
        nombre: configuracion.titulo
      });
      
      console.log('✅ Nombre del vendedor sincronizado:', configuracion.titulo);
    } catch (error) {
      console.error('❌ Error sincronizando nombre del vendedor:', error);
    }
  }

  /**
   * Inicializa reseñas de ejemplo en Firestore
   */
  private async inicializarResenasEjemplo(): Promise<void> {
    try {
      // Verificar si ya existen reseñas
      const resenasQuery = query(this.resenasCollection);
      const resenasSnapshot = await collectionData(resenasQuery, { idField: 'id' }).pipe(
        map(resenas => resenas.length)
      ).toPromise();
      
      if (resenasSnapshot === 0) {
        const resenasEjemplo = [
          {
            productoId: '1',
            usuarioId: 'user1',
            usuarioNombre: 'María González',
            calificacion: 5,
            comentario: 'Excelente producto, llegó muy rápido y en perfectas condiciones. Lo recomiendo 100%.',
            fechaCreacion: new Date('2024-10-10').toISOString(),
            verificada: true,
            util: 12,
            respuestaVendedor: {
              mensaje: '¡Muchas gracias María! Nos alegra que hayas quedado satisfecha con tu compra.',
              fecha: new Date('2024-10-11').toISOString()
            }
          },
          {
            productoId: '1',
            usuarioId: 'user2',
            usuarioNombre: 'Carlos Rodríguez',
            calificacion: 4,
            comentario: 'Muy buen producto, cumple con las expectativas. El envío fue rápido.',
            fechaCreacion: new Date('2024-10-08').toISOString(),
            verificada: true,
            util: 8
          },
          {
            productoId: '1',
            usuarioId: 'user3',
            usuarioNombre: 'Ana Martínez',
            calificacion: 5,
            comentario: 'Increíble calidad-precio. Ya es mi segunda compra y siempre perfecto.',
            fechaCreacion: new Date('2024-10-05').toISOString(),
            verificada: true,
            util: 15
          },
          {
            productoId: '2',
            usuarioId: 'user4',
            usuarioNombre: 'Luis Fernández',
            calificacion: 4,
            comentario: 'Buen producto, aunque tardó un poco más de lo esperado en llegar.',
            fechaCreacion: new Date('2024-10-03').toISOString(),
            verificada: true,
            util: 5
          }
        ];
        
        // Agregar cada reseña a Firestore
        for (const resena of resenasEjemplo) {
          await addDoc(this.resenasCollection, resena);
        }
        
        console.log('✅ Reseñas de ejemplo inicializadas en Firestore');
        
        // Actualizar estadísticas del vendedor
        await this.actualizarEstadisticasVendedor();
      }
    } catch (error) {
      console.error('❌ Error inicializando reseñas:', error);
    }
  }

  /**
   * Obtiene todas las reseñas de un producto específico desde Firestore
   */
  obtenerResenasPorProducto(productoId: string): Observable<Resena[]> {
    const resenasQuery = query(
      this.resenasCollection,
      where('productoId', '==', productoId),
      orderBy('fechaCreacion', 'desc')
    );
    
    return collectionData(resenasQuery, { idField: 'id' }).pipe(
      map(resenas => resenas.map(resena => ({
        ...resena,
        fechaCreacion: new Date(resena['fechaCreacion']),
        respuestaVendedor: resena['respuestaVendedor'] ? {
          ...resena['respuestaVendedor'],
          fecha: new Date(resena['respuestaVendedor']['fecha'])
        } : undefined
      })) as Resena[]),
      catchError(error => {
        console.error('Error obteniendo reseñas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene las estadísticas del vendedor desde Firestore
   */
  obtenerEstadisticasVendedor(): Observable<EstadisticasVendedor> {
    const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
    
    return from(getDoc(vendedorDoc)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          return {
            ...data,
            fechaRegistro: new Date(data['fechaRegistro'])
          } as EstadisticasVendedor;
        } else {
          // Retornar datos por defecto si no existe
          return {
            nombre: 'ALED2025 Store',
            reputacion: 'MercadoLíder',
            calificacionPromedio: 4.8,
            totalVentas: 2847,
            totalResenas: 0,
            fechaRegistro: new Date('2020-03-15'),
            porcentajePositivas: 98.5
          } as EstadisticasVendedor;
        }
      }),
      catchError(error => {
        console.error('Error obteniendo estadísticas del vendedor:', error);
        return of({
          nombre: 'ALED2025 Store',
          reputacion: 'MercadoLíder',
          calificacionPromedio: 4.8,
          totalVentas: 2847,
          totalResenas: 0,
          fechaRegistro: new Date('2020-03-15'),
          porcentajePositivas: 98.5
        } as EstadisticasVendedor);
      })
    );
  }

  /**
   * Calcula el promedio de calificaciones para un producto desde Firestore
   */
  obtenerPromedioCalificacion(productoId: string): Observable<{ promedio: number; total: number }> {
    return this.obtenerResenasPorProducto(productoId).pipe(
      map(resenas => {
        const promedio = resenas.length > 0 
          ? resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length 
          : 0;
        
        return { promedio: Math.round(promedio * 10) / 10, total: resenas.length };
      })
    );
  }

  /**
   * Agrega una nueva reseña a Firestore
   */
  agregarResena(resena: Omit<Resena, 'id' | 'fechaCreacion' | 'util'>): Observable<boolean> {
    const currentUser = this.authService.currentUserSignal();
    
    if (!currentUser) {
      return of(false);
    }

    const nuevaResena = {
      ...resena,
      fechaCreacion: new Date().toISOString(),
      util: 0,
      usuarioNombre: currentUser.nombre + ' ' + currentUser.apellido
    };

    return from(addDoc(this.resenasCollection, nuevaResena)).pipe(
      switchMap(() => {
        // Actualizar estadísticas del vendedor después de agregar la reseña
        return from(this.actualizarEstadisticasVendedor());
      }),
      map(() => {
        console.log('✅ Reseña agregada exitosamente a Firestore');
        return true;
      }),
      catchError(error => {
        console.error('❌ Error agregando reseña:', error);
        return of(false);
      })
    );
  }

  /**
   * Marca una reseña como útil en Firestore
   */
  marcarComoUtil(resenaId: string): Observable<boolean> {
    const resenaDoc = doc(this.firestore, 'resenas', resenaId);
    
    return from(getDoc(resenaDoc)).pipe(
      switchMap(docSnapshot => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const nuevoUtil = (data['util'] || 0) + 1;
          
          return from(updateDoc(resenaDoc, { util: nuevoUtil })).pipe(
            map(() => {
              console.log('✅ Reseña marcada como útil');
              return true;
            })
          );
        } else {
          return of(false);
        }
      }),
      catchError(error => {
        console.error('❌ Error marcando reseña como útil:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtiene la distribución de calificaciones para un producto desde Firestore
   */
  obtenerDistribucionCalificaciones(productoId: string): Observable<{ [key: number]: number }> {
    return this.obtenerResenasPorProducto(productoId).pipe(
      map(resenas => {
        const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        resenas.forEach(resena => {
          distribucion[resena.calificacion as keyof typeof distribucion]++;
        });
        
        return distribucion;
      })
    );
  }

  /**
   * Verifica si el usuario puede dejar una reseña desde Firestore
   */
  puedeDejarResena(productoId: string): Observable<boolean> {
    const currentUser = this.authService.currentUserSignal();
    
    if (!currentUser) {
      return of(false);
    }

    const resenasQuery = query(
      this.resenasCollection,
      where('productoId', '==', productoId),
      where('usuarioId', '==', currentUser.id)
    );
    
    return collectionData(resenasQuery).pipe(
      map(resenas => resenas.length === 0), // Puede reseñar si no ha reseñado antes
      catchError(error => {
        console.error('Error verificando si puede reseñar:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualiza las estadísticas del vendedor en Firestore (método público)
   */
  async actualizarEstadisticasVendedor(): Promise<void> {
    try {
      // Obtener todas las reseñas
      const todasLasResenasQuery = query(this.resenasCollection);
      const todasLasResenas = await collectionData(todasLasResenasQuery).pipe(
        map(resenas => resenas.map(r => ({ ...r, calificacion: r['calificacion'] })))
      ).toPromise();
      
      if (!todasLasResenas) return;
      
      const totalResenas = todasLasResenas.length;
      const promedioGeneral = totalResenas > 0 
        ? todasLasResenas.reduce((sum, r) => sum + r.calificacion, 0) / totalResenas 
        : 4.8;
      
      const resenasPositivas = todasLasResenas.filter(r => r.calificacion >= 4).length;
      const porcentajePositivas = totalResenas > 0 ? (resenasPositivas / totalResenas) * 100 : 98.5;

      // Actualizar en Firestore
      const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
      await updateDoc(vendedorDoc, {
        calificacionPromedio: Math.round(promedioGeneral * 10) / 10,
        totalResenas,
        porcentajePositivas: Math.round(porcentajePositivas * 10) / 10
      });
      
      console.log('✅ Estadísticas del vendedor actualizadas en Firestore');
    } catch (error) {
      console.error('❌ Error actualizando estadísticas del vendedor:', error);
    }
  }

  /**
   * Actualiza el número total de ventas del vendedor
   */
  async actualizarTotalVentas(nuevasVentas: number): Promise<void> {
    try {
      const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
      await updateDoc(vendedorDoc, {
        totalVentas: nuevasVentas
      });
      
      console.log('✅ Total de ventas actualizado:', nuevasVentas);
    } catch (error) {
      console.error('❌ Error actualizando total de ventas:', error);
    }
  }

  /**
   * Incrementa el contador de ventas
   */
  async incrementarVentas(cantidad: number = 1): Promise<void> {
    try {
      const vendedorDoc = doc(this.firestore, 'vendedor', 'aled2025');
      const vendedorSnapshot = await getDoc(vendedorDoc);
      
      if (vendedorSnapshot.exists()) {
        const data = vendedorSnapshot.data();
        const ventasActuales = data['totalVentas'] || 0;
        const nuevasVentas = ventasActuales + cantidad;
        
        await updateDoc(vendedorDoc, {
          totalVentas: nuevasVentas
        });
        
        console.log('✅ Ventas incrementadas:', ventasActuales, '→', nuevasVentas);
      }
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }
}
