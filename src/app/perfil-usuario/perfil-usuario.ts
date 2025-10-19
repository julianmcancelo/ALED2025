import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth';
import { UserService } from '../servicios/user';
import { TarjetaVirtualService } from '../servicios/tarjeta-virtual.service';
import { TarjetaVirtualComponent } from '../shared/components/tarjeta-virtual/tarjeta-virtual.component';
import { PedidosService } from '../servicios/pedidos.service';
import { Pedido, EstadoPedido } from '../shared/models/pedido.model';
import Swal from 'sweetalert2';

// Tipo para las secciones del perfil
type SeccionPerfil = 'datos-personales' | 'datos-entrega' | 'tarjeta-virtual' | 'seguridad' | 'historial';

/**
 * @component PerfilUsuarioComponent
 * Muestra la información del perfil del usuario que ha iniciado sesión.
 * Sistema de navegación por pestañas para mejor organización.
 */
@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, TarjetaVirtualComponent],
  templateUrl: './perfil-usuario.html',
  styleUrls: ['./perfil-usuario.css'],
})
export class PerfilUsuarioComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  authService = inject(AuthService);
  private userService = inject(UserService);
  private tarjetaVirtualService = inject(TarjetaVirtualService);
  private pedidosService = inject(PedidosService);

  // Obtenemos la señal del usuario actual directamente desde el servicio.
  currentUser = this.authService.currentUserSignal;
  
  // Signal para controlar el estado de creación de tarjeta
  creandoTarjeta = signal(false);

  // Signal para controlar la sección activa
  seccionActiva = signal<SeccionPerfil>('datos-personales');

  // Signals para pedidos
  pedidos = signal<Pedido[]>([]);
  cargandoPedidos = signal(false);

  // Computed para estadísticas de pedidos
  estadisticasPedidos = computed(() => {
    const todos = this.pedidos();
    return {
      total: todos.length,
      completados: todos.filter(p => p.estado === 'entregado').length,
      pendientes: todos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando' || p.estado === 'enviado').length,
      totalGastado: todos
        .filter(p => p.estado === 'entregado' || p.estado === 'pagado')
        .reduce((sum, p) => sum + p.total, 0)
    };
  });

  ngOnInit(): void {
    // Cargar pedidos cuando se inicializa el componente
    this.cargarPedidos();
  }

  /**
   * Cambia la sección activa del perfil
   */
  cambiarSeccion(seccion: SeccionPerfil): void {
    this.seccionActiva.set(seccion);
    // Si cambia a historial y no hay pedidos cargados, cargarlos
    if (seccion === 'historial' && this.pedidos().length === 0) {
      this.cargarPedidos();
    }
  }

  /**
   * Carga los pedidos del usuario
   */
  async cargarPedidos(): Promise<void> {
    const usuario = this.currentUser();
    if (!usuario?.id) return;

    this.cargandoPedidos.set(true);
    try {
      const resultado = await this.pedidosService.obtenerPedidosUsuario(usuario.id);
      if (resultado.exito && resultado.pedidos) {
        this.pedidos.set(resultado.pedidos);
      } else {
        this.pedidos.set([]);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      this.pedidos.set([]);
    } finally {
      this.cargandoPedidos.set(false);
    }
  }

  /**
   * Obtiene la clase CSS para el estado del pedido
   */
  obtenerClaseEstado(estado: EstadoPedido): string {
    const clases = {
      'creado': 'bg-secondary',
      'pendiente': 'bg-warning text-dark',
      'pagado': 'bg-primary',
      'preparando': 'bg-info',
      'enviado': 'bg-warning text-dark',
      'entregado': 'bg-success',
      'cancelado': 'bg-secondary',
      'rechazado': 'bg-danger',
      'reembolsado': 'bg-info'
    };
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Obtiene el texto para el estado del pedido
   */
  obtenerTextoEstado(estado: EstadoPedido): string {
    const textos = {
      'creado': 'Creado',
      'pendiente': 'Pendiente',
      'pagado': 'Pagado',
      'preparando': 'Preparando',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado',
      'reembolsado': 'Reembolsado'
    };
    return textos[estado] || 'Desconocido';
  }

  /**
   * Obtiene la clase CSS para el estado estilo Mercado Libre
   */
  obtenerClaseEstadoML(estado: EstadoPedido): string {
    const clases = {
      'cancelado': 'estado-cancelado',
      'rechazado': 'estado-rechazado',
      'reembolsado': 'estado-reembolso',
      'entregado': 'estado-entregado',
      'pendiente': 'estado-pendiente',
      'pagado': 'estado-entregado',
      'preparando': 'estado-pendiente',
      'enviado': 'estado-pendiente',
      'creado': 'estado-pendiente'
    };
    return clases[estado] || 'estado-pendiente';
  }

  /**
   * Abre un modal para editar los datos de envío del usuario.
   */
  async editarDatosEnvio(): Promise<void> {
    const user = this.currentUser();
    if (!user?.id) return;

    const result = await Swal.fire({
      title: 'Datos de Envío',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input id="direccion" value="${user.direccion || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Calle y número">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input id="ciudad" value="${user.ciudad || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Ciudad">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
            <input id="codigoPostal" value="${user.codigoPostal || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Código Postal">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input id="telefono" value="${user.telefono || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Teléfono de contacto">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0077b6',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold'
      },
      preConfirm: () => {
        const direccion = (document.getElementById('direccion') as HTMLInputElement).value;
        const ciudad = (document.getElementById('ciudad') as HTMLInputElement).value;
        const codigoPostal = (document.getElementById('codigoPostal') as HTMLInputElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;

        if (!direccion || !ciudad || !codigoPostal || !telefono) {
          Swal.showValidationMessage('Por favor completa todos los campos');
          return false;
        }

        return { direccion, ciudad, codigoPostal, telefono };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await this.userService.updateUser(user.id, result.value);
        
        // Actualizar la señal del usuario actual
        this.authService.currentUserSignal.set({
          ...user,
          ...result.value
        });

        await Swal.fire({
          icon: 'success',
          title: 'Datos actualizados',
          text: 'Tus datos de envío han sido actualizados correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al actualizar tus datos. Por favor, intenta de nuevo.',
        });
      }
    }
  }

  /**
   * Crea una tarjeta virtual para el usuario actual
   * Solo se puede ejecutar una vez por usuario
   */
  async crearTarjetaVirtual(): Promise<void> {
    const user = this.currentUser();
    if (!user?.id) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar al usuario actual'
      });
      return;
    }

    // Confirmar la creación
    const confirmacion = await Swal.fire({
      title: '¿Crear Tarjeta Virtual?',
      html: `
        <div class="text-left">
          <p>Se creará una tarjeta virtual de prueba para tu cuenta con las siguientes características:</p>
          <ul class="list-unstyled mt-3">
            <li>✅ <strong>Saldo inicial:</strong> $1,000</li>
            <li>✅ <strong>Número único:</strong> Generado automáticamente</li>
            <li>✅ <strong>Estado:</strong> Activa</li>
            <li>✅ <strong>Uso:</strong> Solo para pagos de prueba</li>
          </ul>
          <div class="alert alert-info mt-3">
            <small><i class="bi bi-info-circle me-1"></i>Esta acción solo se puede realizar una vez por cuenta.</small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Crear Tarjeta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (!confirmacion.isConfirmed) return;

    this.creandoTarjeta.set(true);

    try {
      // Verificar que no tenga ya una tarjeta
      const tarjetaExistente = await this.tarjetaVirtualService.obtenerTarjetaPorUsuario(user.id);
      
      if (tarjetaExistente) {
        await Swal.fire({
          icon: 'info',
          title: 'Tarjeta Ya Existe',
          text: 'Ya tienes una tarjeta virtual creada. Recarga la página para verla.'
        });
        return;
      }

      // Crear la tarjeta
      const nombreCompleto = `${user.nombre} ${user.apellido}`;
      const nuevaTarjeta = await this.tarjetaVirtualService.crearTarjetaParaUsuario(user.id, nombreCompleto);

      // Mostrar éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Tarjeta Virtual Creada!',
        html: `
          <div class="text-left">
            <p><strong>✅ Tu tarjeta virtual ha sido creada exitosamente</strong></p>
            <div class="mt-3 p-3 bg-light rounded">
              <p><strong>Número:</strong> **** **** **** ${nuevaTarjeta.numero.slice(-4)}</p>
              <p><strong>Titular:</strong> ${nuevaTarjeta.titular}</p>
              <p><strong>Saldo inicial:</strong> $${nuevaTarjeta.saldo.toLocaleString('es-AR')}</p>
              <p><strong>Estado:</strong> ${nuevaTarjeta.estado}</p>
            </div>
            <div class="alert alert-success mt-3">
              <small><i class="bi bi-check-circle me-1"></i>Ya puedes usar tu tarjeta para realizar pagos de prueba en la aplicación.</small>
            </div>
          </div>
        `,
        confirmButtonText: '¡Perfecto!',
        confirmButtonColor: '#28a745'
      });

      // Recargar la página para mostrar la tarjeta
      window.location.reload();

    } catch (error) {
      console.error('❌ Error al crear tarjeta virtual:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error al Crear Tarjeta',
        html: `
          <p>No se pudo crear tu tarjeta virtual.</p>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Error desconocido'}</p>
          <p><small>Si el problema persiste, contacta al administrador.</small></p>
        `,
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.creandoTarjeta.set(false);
    }
  }

  /**
   * Abre el modal o vista de la tarjeta virtual
   */
  abrirTarjetaVirtual(): void {
    // Navegar a la ruta que muestra la tarjeta virtual completa
    // O simplemente hacer scroll al componente de tarjeta que ya está en la página
    const tarjetaElement = document.querySelector('app-tarjeta-virtual');
    if (tarjetaElement) {
      tarjetaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Signal para mostrar/ocultar la tarjeta virtual
   */
  mostrarTarjeta = signal<boolean>(false);

  /**
   * Toggle para mostrar/ocultar la tarjeta virtual
   */
  toggleTarjetaVirtual(): void {
    this.mostrarTarjeta.update(valor => !valor);
  }

  /**
   * Verifica si el usuario tiene una tarjeta virtual
   */
  tieneTarjeta = signal<boolean>(false);
}
