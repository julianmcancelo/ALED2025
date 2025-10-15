/**
 * COMPONENTE DE GESTIÓN DE TARJETAS VIRTUALES
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TarjetaVirtualService } from '../../servicios/tarjeta-virtual.service';
import { UserService } from '../../servicios/user';
import { AuthService } from '../../auth/auth';
import { TarjetaVirtual, EstadoTarjeta } from '../../shared/models/tarjeta-virtual.model';
import { AppUser } from '../../auth/auth';
import Swal from 'sweetalert2';

interface TarjetaConUsuario {
  tarjeta: TarjetaVirtual;
  usuario: AppUser;
}

@Component({
  selector: 'app-gestion-tarjetas-virtuales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-tarjetas-virtuales.component.html',
  styleUrls: ['./gestion-tarjetas-virtuales.component.css']
})
export class GestionTarjetasVirtualesComponent implements OnInit {
  // Servicios
  private tarjetaService = inject(TarjetaVirtualService);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  // Signals
  private readonly tarjetasConUsuarios = signal<TarjetaConUsuario[]>([]);
  private readonly cargando = signal<boolean>(true);
  private readonly error = signal<string | null>(null);

  // Filtros
  filtroTexto = '';
  filtroEstado: EstadoTarjeta | 'todos' = 'todos';

  // Computed signals
  readonly estaCargando = computed(() => this.cargando());
  readonly hayError = computed(() => this.error());
  readonly adminActual = computed(() => this.authService.currentUserSignal());

  readonly tarjetasFiltradas = computed(() => {
    const tarjetas = this.tarjetasConUsuarios();
    const texto = this.filtroTexto.toLowerCase();
    const estado = this.filtroEstado;

    return tarjetas.filter(item => {
      const coincideTexto = !texto || 
        item.usuario.nombre?.toLowerCase().includes(texto) ||
        item.usuario.apellido?.toLowerCase().includes(texto) ||
        item.usuario.email?.toLowerCase().includes(texto) ||
        item.tarjeta.numero.includes(texto);

      const coincideEstado = estado === 'todos' || item.tarjeta.estado === estado;

      return coincideTexto && coincideEstado;
    });
  });

  readonly estadisticas = computed(() => {
    const tarjetas = this.tarjetasConUsuarios();
    return {
      total: tarjetas.length,
      activas: tarjetas.filter(t => t.tarjeta.estado === 'activa').length,
      bloqueadas: tarjetas.filter(t => t.tarjeta.estado === 'bloqueada').length,
      suspendidas: tarjetas.filter(t => t.tarjeta.estado === 'suspendida').length,
      saldoTotal: tarjetas.reduce((sum, t) => sum + t.tarjeta.saldo, 0)
    };
  });

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarTarjetasVirtuales();
  }

  private verificarPermisos(): void {
    const usuario = this.adminActual();
    if (!usuario || usuario.rol !== 'admin') {
      this.error.set('No tienes permisos para acceder a esta sección');
      this.cargando.set(false);
      return;
    }
  }

  private async obtenerTodosLosUsuarios(): Promise<AppUser[]> {
    return new Promise((resolve, reject) => {
      const subscription = this.userService.getUsers().subscribe({
        next: (usuarios) => {
          subscription.unsubscribe();
          resolve(usuarios);
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        }
      });
    });
  }

  private async obtenerTodasLasTarjetas(): Promise<TarjetaVirtual[]> {
    try {
      console.log('💳 Obteniendo todas las tarjetas directamente...');
      
      // Usar el método del servicio que ya funciona
      const usuarios = await this.obtenerTodosLosUsuarios();
      const tarjetas: TarjetaVirtual[] = [];
      
      for (const usuario of usuarios) {
        if (!usuario.id) continue;
        
        try {
          // Usar método directo sin historial para evitar error de índice
          const tarjeta = await this.obtenerTarjetaSinHistorial(usuario.id);
          if (tarjeta) {
            tarjetas.push(tarjeta);
          }
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener tarjeta para usuario ${usuario.id}:`, error);
          // Continuar con el siguiente usuario
        }
      }
      
      console.log(`✅ Se obtuvieron ${tarjetas.length} tarjetas`);
      return tarjetas;
      
    } catch (error) {
      console.error('❌ Error al obtener tarjetas:', error);
      return [];
    }
  }

  /**
   * Obtiene una tarjeta virtual sin cargar el historial para evitar el error de índice
   */
  private async obtenerTarjetaSinHistorial(usuarioId: string): Promise<TarjetaVirtual | null> {
    try {
      return new Promise((resolve, reject) => {
        import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
          const firestore = this.tarjetaService['firestore'];
          const tarjetasRef = collection(firestore, 'tarjetas-virtuales');
          const q = query(tarjetasRef, where('usuarioId', '==', usuarioId));
          
          getDocs(q).then(snapshot => {
            if (snapshot.empty) {
              resolve(null);
              return;
            }
            
            const doc = snapshot.docs[0];
            const data = doc.data();
            const tarjeta: TarjetaVirtual = {
              id: doc.id,
              ...data,
              fechaCreacion: data['fechaCreacion']?.toDate() || new Date(),
              fechaActualizacion: data['fechaActualizacion']?.toDate() || new Date()
            } as TarjetaVirtual;
            
            resolve(tarjeta);
          }).catch(reject);
        }).catch(reject);
      });
    } catch (error) {
      console.warn(`⚠️ Error al obtener tarjeta sin historial para usuario ${usuarioId}:`, error);
      return null;
    }
  }

  private async cargarTarjetasVirtuales(): Promise<void> {
    try {
      console.log('🔍 Cargando todas las tarjetas virtuales...');
      this.cargando.set(true);
      this.error.set(null);

      const [usuarios, todasLasTarjetas] = await Promise.all([
        this.obtenerTodosLosUsuarios(),
        this.obtenerTodasLasTarjetas()
      ]);

      console.log(`👥 Se encontraron ${usuarios.length} usuarios`);
      console.log(`💳 Se encontraron ${todasLasTarjetas.length} tarjetas`);

      const tarjetasConUsuarios: TarjetaConUsuario[] = [];

      for (const tarjeta of todasLasTarjetas) {
        const usuario = usuarios.find(u => u.id === tarjeta.usuarioId);
        if (usuario) {
          tarjetasConUsuarios.push({
            tarjeta,
            usuario
          });
        }
      }

      this.tarjetasConUsuarios.set(tarjetasConUsuarios);
      console.log(`✅ Se cargaron ${tarjetasConUsuarios.length} tarjetas virtuales`);

    } catch (error) {
      console.error('❌ Error al procesar tarjetas:', error);
      this.error.set('Error al cargar las tarjetas virtuales');
    } finally {
      this.cargando.set(false);
    }
  }

  async modificarSaldo(tarjetaConUsuario: TarjetaConUsuario): Promise<void> {
    const admin = this.adminActual();
    if (!admin) return;

    const { value: formData } = await Swal.fire({
      title: 'Modificar Saldo',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <strong>Usuario:</strong> ${tarjetaConUsuario.usuario.nombre} ${tarjetaConUsuario.usuario.apellido}<br>
            <strong>Saldo actual:</strong> $${tarjetaConUsuario.tarjeta.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Monto a modificar</label>
            <input id="monto" type="number" step="0.01" style="width: 100%; padding: 8px;" placeholder="Positivo para agregar, negativo para quitar">
            <small style="color: #666;">Ejemplo: 1000 para agregar $1000, -500 para quitar $500</small>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Descripción</label>
            <input id="descripcion" style="width: 100%; padding: 8px;" placeholder="Motivo de la modificación">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px;">Justificación (opcional)</label>
            <textarea id="justificacion" style="width: 100%; padding: 8px;" rows="3" placeholder="Justificación detallada"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Modificar Saldo',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const monto = parseFloat((document.getElementById('monto') as HTMLInputElement).value);
        const descripcion = (document.getElementById('descripcion') as HTMLInputElement).value;
        const justificacion = (document.getElementById('justificacion') as HTMLTextAreaElement).value;

        if (isNaN(monto) || monto === 0) {
          Swal.showValidationMessage('Por favor ingrese un monto válido diferente de cero');
          return false;
        }

        if (!descripcion.trim()) {
          Swal.showValidationMessage('Por favor ingrese una descripción');
          return false;
        }

        return { monto, descripcion, justificacion };
      }
    });

    if (formData) {
      try {
        const solicitud: any = {
          tarjetaId: tarjetaConUsuario.tarjeta.id!,
          monto: formData.monto,
          descripcion: formData.descripcion,
          claveIdempotencia: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Solo incluir justificacion si tiene valor
        if (formData.justificacion && formData.justificacion.trim()) {
          solicitud.justificacion = formData.justificacion.trim();
        }
        
        const resultado = await this.tarjetaService.modificarSaldo(
          solicitud,
          admin.id!,
          `${admin.nombre} ${admin.apellido}`
        );

        if (resultado.exito) {
          await Swal.fire({
            title: '¡Saldo Modificado!',
            text: `El saldo se ha ${formData.monto > 0 ? 'incrementado' : 'reducido'} correctamente.`,
            icon: 'success'
          });
          await this.cargarTarjetasVirtuales();
        } else {
          await Swal.fire({
            title: 'Error',
            text: resultado.mensaje,
            icon: 'error'
          });
        }

      } catch (error) {
        console.error('❌ Error al modificar saldo:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Error al modificar el saldo de la tarjeta',
          icon: 'error'
        });
      }
    }
  }

  async cambiarEstado(tarjetaConUsuario: TarjetaConUsuario): Promise<void> {
    const estadoActual = tarjetaConUsuario.tarjeta.estado;
    const nuevoEstado: EstadoTarjeta = estadoActual === 'activa' ? 'bloqueada' : 'activa';
    const accion = nuevoEstado === 'bloqueada' ? 'bloquear' : 'desbloquear';

    const { value: justificacion } = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} tarjeta?`,
      text: `¿Estás seguro de que quieres ${accion} esta tarjeta?`,
      input: 'textarea',
      inputLabel: 'Justificación (opcional)',
      inputPlaceholder: `Motivo para ${accion} la tarjeta...`,
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (justificacion !== undefined) {
      try {
        const admin = this.adminActual();
        if (!admin) return;

        const resultado = await this.tarjetaService.cambiarEstadoTarjeta(
          tarjetaConUsuario.tarjeta.id!,
          nuevoEstado,
          admin.id!,
          `${admin.nombre} ${admin.apellido}`,
          (justificacion && justificacion.trim()) || `Tarjeta ${accion}da por administrador`
        );

        if (resultado.exito) {
          await Swal.fire({
            title: '¡Estado Cambiado!',
            text: `La tarjeta ha sido ${accion}da correctamente.`,
            icon: 'success'
          });
          await this.cargarTarjetasVirtuales();
        } else {
          await Swal.fire({
            title: 'Error',
            text: resultado.mensaje,
            icon: 'error'
          });
        }

      } catch (error) {
        console.error(`❌ Error al ${accion} tarjeta:`, error);
        await Swal.fire({
          title: 'Error',
          text: `Error al ${accion} la tarjeta`,
          icon: 'error'
        });
      }
    }
  }

  async recargarDatos(): Promise<void> {
    await this.cargarTarjetasVirtuales();
  }

  getClaseEstado(estado: EstadoTarjeta): string {
    switch (estado) {
      case 'activa': return 'badge bg-success';
      case 'bloqueada': return 'badge bg-danger';
      case 'suspendida': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  formatearMonto(monto: number): string {
    return monto.toLocaleString('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 2 
    });
  }
}
