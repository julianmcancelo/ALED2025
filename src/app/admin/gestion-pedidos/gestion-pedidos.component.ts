import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionPedidosService, Pedido, EstadoPedido } from '../../servicios/gestion-pedidos.service';
import Swal from 'sweetalert2';

/**
 * ============================================================================
 * COMPONENTE: GESTIÓN DE PEDIDOS
 * ============================================================================
 * 
 * Este componente permite al administrador gestionar todos los pedidos:
 * - Ver lista de pedidos
 * - Filtrar por estado
 * - Cambiar estados de pedidos
 * - Agregar notas y números de seguimiento
 * - Ver detalles completos de cada pedido
 */
@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-pedidos.component.html',
  styleUrls: ['./gestion-pedidos.component.css']
})
export class GestionPedidosComponent implements OnInit {

  // --- SIGNALS PARA ESTADO REACTIVO ---
  pedidos = signal<Pedido[]>([]);
  cargando = signal<boolean>(true);
  filtroEstado = signal<string>('todos');
  busquedaTexto = signal<string>('');

  // --- COMPUTED SIGNALS ---
  // Pedidos filtrados según los criterios seleccionados
  pedidosFiltrados = computed(() => {
    let resultado = this.pedidos();
    
    // Filtrar por estado
    if (this.filtroEstado() !== 'todos') {
      resultado = resultado.filter(pedido => pedido.estado === this.filtroEstado());
    }
    
    // Filtrar por texto de búsqueda
    const busqueda = this.busquedaTexto().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(pedido => 
        pedido.id.toLowerCase().includes(busqueda) ||
        pedido.cliente.email?.toLowerCase().includes(busqueda) ||
        pedido.cliente.nombre?.toLowerCase().includes(busqueda) ||
        pedido.cliente.apellido?.toLowerCase().includes(busqueda)
      );
    }
    
    return resultado;
  });

  // Estadísticas computadas
  estadisticas = computed(() => {
    const todos = this.pedidos();
    return {
      total: todos.length,
      pendientes: todos.filter(p => p.estado === EstadoPedido.PENDIENTE).length,
      confirmados: todos.filter(p => p.estado === EstadoPedido.CONFIRMADO).length,
      preparando: todos.filter(p => p.estado === EstadoPedido.PREPARANDO).length,
      enviados: todos.filter(p => p.estado === EstadoPedido.ENVIADO).length,
      entregados: todos.filter(p => p.estado === EstadoPedido.ENTREGADO).length,
      cancelados: todos.filter(p => p.estado === EstadoPedido.CANCELADO).length
    };
  });

  // --- PROPIEDADES PÚBLICAS ---
  EstadoPedido = EstadoPedido; // Para usar en el template
  pedidoSeleccionado: Pedido | null = null;
  mostrarDetalles = signal<boolean>(false);

  constructor(private gestionPedidosService: GestionPedidosService) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  /**
   * ============================================================================
   * MÉTODOS PARA CARGAR DATOS
   * ============================================================================
   */

  /**
   * Carga todos los pedidos desde Firestore
   */
  cargarPedidos(): void {
    console.log('📋 Cargando pedidos...');
    this.cargando.set(true);
    
    this.gestionPedidosService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos) => {
        console.log(`✅ ${pedidos.length} pedidos cargados`);
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar pedidos:', error);
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los pedidos. Intenta recargar la página.',
        });
      }
    });
  }

  /**
   * ============================================================================
   * MÉTODOS PARA FILTROS Y BÚSQUEDA
   * ============================================================================
   */

  /**
   * Cambia el filtro de estado
   * @param nuevoFiltro - Nuevo filtro a aplicar
   */
  cambiarFiltroEstado(nuevoFiltro: string): void {
    console.log(`🔍 Cambiando filtro a: ${nuevoFiltro}`);
    this.filtroEstado.set(nuevoFiltro);
  }

  /**
   * Actualiza el texto de búsqueda
   * @param evento - Evento del input de búsqueda
   */
  actualizarBusqueda(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.busquedaTexto.set(input.value);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.busquedaTexto.set('');
  }

  /**
   * ============================================================================
   * MÉTODOS PARA GESTIÓN DE PEDIDOS
   * ============================================================================
   */

  /**
   * Cambia el estado de un pedido
   * @param pedido - Pedido a actualizar
   * @param nuevoEstado - Nuevo estado del pedido
   */
  async cambiarEstadoPedido(pedido: Pedido, nuevoEstado: EstadoPedido): Promise<void> {
    try {
      // Mostrar diálogo de confirmación
      const { value: notas } = await Swal.fire({
        title: `Cambiar estado a "${this.gestionPedidosService.obtenerTextoEstado(nuevoEstado)}"`,
        text: `¿Estás seguro de cambiar el estado del pedido ${pedido.id}?`,
        input: 'textarea',
        inputLabel: 'Notas adicionales (opcional)',
        inputPlaceholder: 'Escribe cualquier nota sobre este cambio...',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar estado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      });

      if (notas !== undefined) { // Usuario confirmó (incluso si no escribió notas)
        // Actualizar estado en Firestore
        await this.gestionPedidosService.actualizarEstadoPedido(
          pedido.id, 
          nuevoEstado, 
          notas || undefined
        );

        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Estado actualizado!',
          text: `El pedido ${pedido.id} ahora está en estado "${this.gestionPedidosService.obtenerTextoEstado(nuevoEstado)}"`,
          timer: 3000,
          showConfirmButton: false
        });

        // Los datos se actualizarán automáticamente por el Observable
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del pedido. Intenta de nuevo.',
      });
    }
  }

  /**
   * Agrega número de seguimiento a un pedido
   * @param pedido - Pedido al que agregar seguimiento
   */
  async agregarSeguimiento(pedido: Pedido): Promise<void> {
    try {
      const { value: numeroSeguimiento } = await Swal.fire({
        title: 'Agregar Número de Seguimiento',
        text: `Pedido: ${pedido.id}`,
        input: 'text',
        inputLabel: 'Número de seguimiento',
        inputPlaceholder: 'Ej: AR123456789',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Debes ingresar un número de seguimiento';
          }
          return null;
        }
      });

      if (numeroSeguimiento) {
        await this.gestionPedidosService.agregarNumeroSeguimiento(
          pedido.id, 
          numeroSeguimiento
        );

        Swal.fire({
          icon: 'success',
          title: '¡Seguimiento agregado!',
          text: `Número de seguimiento: ${numeroSeguimiento}`,
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('❌ Error al agregar seguimiento:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el número de seguimiento. Intenta de nuevo.',
      });
    }
  }

  /**
   * ============================================================================
   * MÉTODOS PARA DETALLES DE PEDIDOS
   * ============================================================================
   */

  /**
   * Muestra los detalles completos de un pedido
   * @param pedido - Pedido a mostrar
   */
  verDetallesPedido(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarDetalles.set(true);
  }

  /**
   * Cierra el modal de detalles
   */
  cerrarDetalles(): void {
    this.pedidoSeleccionado = null;
    this.mostrarDetalles.set(false);
  }

  /**
   * ============================================================================
   * MÉTODOS AUXILIARES
   * ============================================================================
   */

  /**
   * Obtiene el texto del estado en español
   * @param estado - Estado del pedido
   * @returns Texto en español
   */
  obtenerTextoEstado(estado: EstadoPedido): string {
    return this.gestionPedidosService.obtenerTextoEstado(estado);
  }

  /**
   * Obtiene las clases CSS para el color del estado
   * @param estado - Estado del pedido
   * @returns Clases CSS
   */
  obtenerColorEstado(estado: EstadoPedido): string {
    return this.gestionPedidosService.obtenerColorEstado(estado);
  }

  /**
   * Formatea el total como moneda
   * @param total - Monto total
   * @param moneda - Código de moneda
   * @returns String formateado
   */
  formatearTotal(total: number, moneda: string = 'ARS'): string {
    return this.gestionPedidosService.formatearTotal(total, moneda);
  }

  /**
   * Formatea una fecha para mostrar
   * @param fecha - Fecha a formatear
   * @returns String de fecha formateada
   */
  formatearFecha(fecha: Date | any): string {
    if (!fecha) return 'No disponible';
    
    // Convertir Timestamp de Firestore a Date si es necesario
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
    
    return fechaObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene los próximos estados posibles para un pedido
   * @param estadoActual - Estado actual del pedido
   * @returns Array de estados posibles
   */
  obtenerEstadosPosibles(estadoActual: EstadoPedido): EstadoPedido[] {
    const flujoEstados = {
      [EstadoPedido.PENDIENTE]: [EstadoPedido.CONFIRMADO, EstadoPedido.CANCELADO],
      [EstadoPedido.CONFIRMADO]: [EstadoPedido.PREPARANDO, EstadoPedido.CANCELADO],
      [EstadoPedido.PREPARANDO]: [EstadoPedido.ENVIADO, EstadoPedido.CANCELADO],
      [EstadoPedido.ENVIADO]: [EstadoPedido.ENTREGADO],
      [EstadoPedido.ENTREGADO]: [], // Estado final
      [EstadoPedido.CANCELADO]: [] // Estado final
    };
    
    return flujoEstados[estadoActual] || [];
  }
}
