import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Servicios
import { UserService } from '../../servicios/user';
import { NovedadesService } from '../../servicios/novedades.service';

import Swal from 'sweetalert2';
import * as bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * PANEL DE PRUEBAS INTEGRAL - ADMINISTRACIÓN
 * ============================================================================
 * 
 * Este componente permite probar todos los recursos y funcionalidades
 * de la aplicación desde un panel centralizado de administración.
 */

interface ResultadoPrueba {
  nombre: string;
  estado: 'pendiente' | 'ejecutando' | 'exitoso' | 'error';
  mensaje: string;
  tiempo?: number;
  detalles?: any;
}

@Component({
  selector: 'app-panel-pruebas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Encabezado -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="h3 mb-1">🧪 Panel de Pruebas Integral</h2>
              <p class="text-muted mb-0">Prueba todos los recursos y funcionalidades de la aplicación</p>
            </div>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-secondary btn-sm"
                (click)="limpiarResultados()"
                [disabled]="ejecutandoPruebas()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Panel de Control -->
        <div class="col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-gear me-2"></i>
                Control de Pruebas
              </h5>
            </div>
            <div class="card-body">
              
              <!-- Botón Principal -->
              <div class="d-grid mb-3">
                <button 
                  class="btn btn-success btn-lg"
                  (click)="ejecutarTodasLasPruebas()"
                  [disabled]="ejecutandoPruebas()">
                  @if (ejecutandoPruebas()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Ejecutando...
                  } @else {
                    <i class="bi bi-play-circle me-2"></i>
                    Ejecutar Todas las Pruebas
                  }
                </button>
              </div>

              <!-- Pruebas Individuales -->
              <div class="mb-3">
                <h6 class="fw-bold mb-3">Pruebas Individuales:</h6>
                
                <div class="d-grid gap-2">
                  <button 
                    class="btn btn-outline-primary btn-sm"
                    (click)="probarAutenticacion()"
                    [disabled]="ejecutandoPruebas()">
                    <i class="bi bi-shield-check me-1"></i>
                    Autenticación
                  </button>

                  <button 
                    class="btn btn-outline-primary btn-sm"
                    (click)="probarNovedades()"
                    [disabled]="ejecutandoPruebas()">
                    <i class="bi bi-newspaper me-1"></i>
                    Novedades
                  </button>

                  <button 
                    class="btn btn-outline-primary btn-sm"
                    (click)="probarNavegacion()"
                    [disabled]="ejecutandoPruebas()">
                    <i class="bi bi-compass me-1"></i>
                    Navegación
                  </button>

                  <button 
                    class="btn btn-outline-success btn-sm"
                    (click)="crearUsuariosPrueba()"
                    [disabled]="ejecutandoPruebas()">
                    <i class="bi bi-person-plus me-1"></i>
                    Crear Usuarios de Prueba
                  </button>

                  <button 
                    class="btn btn-outline-warning btn-sm"
                    (click)="crearUsuariosSimple()"
                    [disabled]="ejecutandoPruebas()">
                    <i class="bi bi-person-check me-1"></i>
                    Crear Usuarios (Simple)
                  </button>
                </div>
              </div>

              <!-- Progreso -->
              @if (ejecutandoPruebas()) {
                <div class="mt-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <small class="text-muted">Progreso:</small>
                    <small class="text-muted">{{ progreso() }}%</small>
                  </div>
                  <div class="progress mb-2">
                    <div 
                      class="progress-bar progress-bar-striped progress-bar-animated" 
                      [style.width.%]="progreso()">
                    </div>
                  </div>
                  <small class="text-primary">
                    <i class="bi bi-arrow-right me-1"></i>
                    {{ pruebaActual() }}
                  </small>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Panel de Resultados -->
        <div class="col-lg-8 mb-4">
          <div class="card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">
                <i class="bi bi-clipboard-data me-2"></i>
                Resultados de Pruebas
                @if (resultados().length > 0) {
                  <span class="badge bg-light text-dark ms-2">{{ resultados().length }}</span>
                }
              </h5>
            </div>
            <div class="card-body">
              
              @if (resultados().length === 0) {
                <div class="text-center py-5">
                  <i class="bi bi-clipboard-x display-1 text-muted"></i>
                  <h5 class="text-muted mt-3">No hay resultados aún</h5>
                  <p class="text-muted">Ejecuta las pruebas para ver los resultados aquí</p>
                </div>
              } @else {
                <!-- Lista de Resultados -->
                <div class="row">
                  @for (resultado of resultados(); track $index) {
                    <div class="col-md-6 mb-3">
                      <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                          <div class="d-flex align-items-center mb-2">
                            @if (resultado.estado === 'exitoso') {
                              <i class="bi bi-check-circle-fill text-success me-2"></i>
                            } @else if (resultado.estado === 'error') {
                              <i class="bi bi-x-circle-fill text-danger me-2"></i>
                            } @else if (resultado.estado === 'ejecutando') {
                              <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                            } @else {
                              <i class="bi bi-clock text-warning me-2"></i>
                            }
                            <h6 class="mb-0 fw-bold">{{ resultado.nombre }}</h6>
                          </div>
                          
                          <p class="text-muted mb-2 small">{{ resultado.mensaje }}</p>
                          
                          @if (resultado.tiempo) {
                            <small class="text-muted">
                              <i class="bi bi-stopwatch me-1"></i>
                              {{ resultado.tiempo }}ms
                            </small>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Resumen -->
                @if (!ejecutandoPruebas() && resultados().length > 0) {
                  <div class="mt-4 p-3 bg-light rounded">
                    <h6 class="fw-bold mb-2">📊 Resumen:</h6>
                    <div class="row text-center">
                      <div class="col-4">
                        <div class="text-success">
                          <i class="bi bi-check-circle-fill"></i>
                          <div class="fw-bold">{{ contarExitosas() }}</div>
                          <small>Exitosas</small>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="text-danger">
                          <i class="bi bi-x-circle-fill"></i>
                          <div class="fw-bold">{{ contarFallidas() }}</div>
                          <small>Fallidas</small>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="text-primary">
                          <i class="bi bi-stopwatch"></i>
                          <div class="fw-bold">{{ calcularTiempoTotal() }}ms</div>
                          <small>Tiempo Total</small>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .btn {
      transition: all 0.3s ease;
      border-radius: 8px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .progress {
      height: 8px;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
      border-radius: 10px;
      background: linear-gradient(90deg, #007bff, #28a745);
    }

    .display-1 {
      font-size: 6rem;
      font-weight: 300;
      line-height: 1.2;
    }
  `]
})
export class PanelPruebasComponent {

  // --- INYECCIÓN DE SERVICIOS ---
  private userService = inject(UserService);
  private novedadesService = inject(NovedadesService);
  private router = inject(Router);

  // --- ESTADO DEL COMPONENTE ---
  ejecutandoPruebas = signal(false);
  pruebaActual = signal('');
  progreso = signal(0);
  resultados = signal<ResultadoPrueba[]>([]);

  // --- MÉTODOS PRINCIPALES ---

  /**
   * Ejecuta todas las pruebas
   */
  async ejecutarTodasLasPruebas(): Promise<void> {
    this.ejecutandoPruebas.set(true);
    this.progreso.set(0);
    this.resultados.set([]); // Limpiar resultados previos

    const pruebas = [
      { nombre: 'Autenticación', funcion: () => this.probarAutenticacion() },
      { nombre: 'Novedades', funcion: () => this.probarNovedades() },
      { nombre: 'Navegación', funcion: () => this.probarNavegacion() }
    ];

    console.log('🧪 Iniciando batería de pruebas completa...');

    for (let i = 0; i < pruebas.length; i++) {
      const prueba = pruebas[i];
      this.pruebaActual.set(prueba.nombre);
      
      try {
        await prueba.funcion();
        this.progreso.set(Math.round(((i + 1) / pruebas.length) * 100));
      } catch (error) {
        console.error(`Error en prueba ${prueba.nombre}:`, error);
      }
      
      // Pausa entre pruebas
      await this.esperar(500);
    }

    this.ejecutandoPruebas.set(false);
    this.pruebaActual.set('');
    this.mostrarResumenFinal();
  }

  /**
   * Prueba el sistema de autenticación
   */
  async probarAutenticacion(): Promise<void> {
    const inicio = Date.now();
    this.agregarResultado('Autenticación', 'ejecutando', 'Probando sistema de autenticación...');

    try {
      const existenUsuarios = await this.userService.checkIfUsersExist();
      
      if (existenUsuarios) {
        const tiempo = Date.now() - inicio;
        this.actualizarResultado('Autenticación', 'exitoso', 
          'Sistema de usuarios operativo', tiempo);
      } else {
        throw new Error('No se encontraron usuarios en el sistema');
      }

    } catch (error: any) {
      const tiempo = Date.now() - inicio;
      this.actualizarResultado('Autenticación', 'error', 
        `Error: ${error.message || error}`, tiempo);
    }
  }

  /**
   * Prueba el sistema de novedades
   */
  async probarNovedades(): Promise<void> {
    const inicio = Date.now();
    this.agregarResultado('Novedades', 'ejecutando', 'Probando sistema de novedades...');

    try {
      const novedades = await this.novedadesService.getNovedades().toPromise();
      
      if (novedades) {
        const tiempo = Date.now() - inicio;
        this.actualizarResultado('Novedades', 'exitoso', 
          `${novedades.length} novedades encontradas`, tiempo);
      } else {
        throw new Error('No se pudieron obtener novedades');
      }

    } catch (error: any) {
      const tiempo = Date.now() - inicio;
      this.actualizarResultado('Novedades', 'error', 
        `Error: ${error.message || error}`, tiempo);
    }
  }

  /**
   * Prueba el sistema de navegación
   */
  async probarNavegacion(): Promise<void> {
    const inicio = Date.now();
    this.agregarResultado('Navegación', 'ejecutando', 'Probando sistema de navegación...');

    try {
      const rutaActual = this.router.url;
      
      const tiempo = Date.now() - inicio;
      this.actualizarResultado('Navegación', 'exitoso', 
        'Sistema de navegación operativo', tiempo);

    } catch (error: any) {
      const tiempo = Date.now() - inicio;
      this.actualizarResultado('Navegación', 'error', 
        `Error: ${error.message || error}`, tiempo);
    }
  }

  /**
   * Método de test simple para verificar que los botones funcionan
   */
  testBoton(): void {
    console.log('🧪 Test botón funcionando');
    Swal.fire({
      title: '✅ Botón funciona',
      text: 'Los botones están funcionando correctamente',
      icon: 'success',
      timer: 2000
    });
  }

  /**
   * Versión simplificada para crear usuarios
   */
  async crearUsuariosSimple(): Promise<void> {
    try {
      console.log('🚀 Iniciando creación simple de usuarios');
      
      const confirmacion = await Swal.fire({
        title: 'Crear Usuarios de Prueba',
        text: '¿Crear 4 usuarios para la presentación?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, crear',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      // Crear usuarios directamente sin hash complejo
      const usuarios = [
        { nombre: 'Admin', apellido: 'Sistema', email: 'admin@aled2025.com', password: '123456', dni: '12345678', rol: 'admin' as const, novedades: true, terminos: true },
        { nombre: 'Julian', apellido: 'Cancelo', email: 'julian@test.com', password: '123456', dni: '87654321', rol: 'usuario' as const, novedades: true, terminos: true },
        { nombre: 'Nicolas', apellido: 'Otero', email: 'nicolas@test.com', password: '123456', dni: '11223344', rol: 'usuario' as const, novedades: true, terminos: true },
        { nombre: 'Cliente', apellido: 'Demo', email: 'cliente@demo.com', password: '123456', dni: '55667788', rol: 'usuario' as const, novedades: true, terminos: true }
      ];

      let creados = 0;
      for (const usuario of usuarios) {
        try {
          // Hash simple
          const passwordHash = await bcrypt.hash(usuario.password, 10);
          await this.userService.addUser({ ...usuario, password: passwordHash });
          creados++;
          console.log(`✅ Usuario creado: ${usuario.email}`);
        } catch (error) {
          console.warn(`⚠️ Usuario ${usuario.email} ya existe`);
        }
      }

      await Swal.fire({
        title: creados > 0 ? '✅ Usuarios Creados' : '⚠️ Usuarios ya existen',
        text: creados > 0 ? `${creados} usuarios creados exitosamente` : 'Los usuarios ya existían en el sistema',
        icon: creados > 0 ? 'success' : 'info',
        confirmButtonText: 'Entendido'
      });

    } catch (error: any) {
      console.error('❌ Error:', error);
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Error desconocido',
        icon: 'error'
      });
    }
  }

  /**
   * Crea usuarios de prueba para la presentación
   */
  async crearUsuariosPrueba(): Promise<void> {
    console.log('🔧 Botón crear usuarios presionado');
    
    try {
      // Primero mostrar un alert simple para verificar que funciona
      await Swal.fire({
        title: 'Función funcionando',
        text: 'El botón está funcionando. Procediendo a crear usuarios...',
        icon: 'info',
        timer: 2000
      });

      const inicio = Date.now();
      this.agregarResultado('Usuarios de Prueba', 'ejecutando', 'Creando usuarios de prueba...');

      // Confirmar con el usuario
      const confirmacion = await Swal.fire({
        title: '👥 Crear Usuarios de Prueba',
        html: `
          <div class="text-start">
            <p>Se crearán los siguientes usuarios para la presentación:</p>
            <ul>
              <li><strong>Admin:</strong> admin@aled2025.com (Administrador)</li>
              <li><strong>Usuario 1:</strong> julian@test.com (Cliente)</li>
              <li><strong>Usuario 2:</strong> nicolas@test.com (Cliente)</li>
              <li><strong>Usuario 3:</strong> cliente@demo.com (Cliente)</li>
            </ul>
            <p><small class="text-muted">Contraseña para todos: <strong>123456</strong></small></p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Crear Usuarios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745'
      });

      if (!confirmacion.isConfirmed) {
        const tiempo = Date.now() - inicio;
        this.actualizarResultado('Usuarios de Prueba', 'error', 'Operación cancelada por el usuario', tiempo);
        return;
      }

      console.log('🔐 Hasheando contraseña...');
      // Hash de la contraseña común
      const passwordHash = await bcrypt.hash('123456', 10);
      console.log('✅ Contraseña hasheada');

      // Usuarios de prueba
      const usuariosPrueba = [
        {
          nombre: 'Administrador',
          apellido: 'Sistema',
          email: 'admin@aled2025.com',
          password: passwordHash,
          dni: '12345678',
          rol: 'admin' as const,
          novedades: true,
          terminos: true,
          direccion: 'Av. Principal 123',
          ciudad: 'Buenos Aires',
          codigoPostal: '1000',
          telefono: '+54 11 1234-5678'
        },
        {
          nombre: 'Julian',
          apellido: 'Cancelo',
          email: 'julian@test.com',
          password: passwordHash,
          dni: '87654321',
          rol: 'usuario' as const,
          novedades: true,
          terminos: true,
          direccion: 'Calle Falsa 456',
          ciudad: 'Córdoba',
          codigoPostal: '5000',
          telefono: '+54 351 987-6543'
        },
        {
          nombre: 'Nicolas',
          apellido: 'Otero',
          email: 'nicolas@test.com',
          password: passwordHash,
          dni: '11223344',
          rol: 'usuario' as const,
          novedades: false,
          terminos: true,
          direccion: 'Av. Libertador 789',
          ciudad: 'Rosario',
          codigoPostal: '2000',
          telefono: '+54 341 555-0123'
        },
        {
          nombre: 'Cliente',
          apellido: 'Demo',
          email: 'cliente@demo.com',
          password: passwordHash,
          dni: '55667788',
          rol: 'usuario' as const,
          novedades: true,
          terminos: true,
          direccion: 'Paseo Colón 321',
          ciudad: 'La Plata',
          codigoPostal: '1900',
          telefono: '+54 221 444-9876'
        }
      ];

      console.log('👥 Creando usuarios:', usuariosPrueba.length);

      // Crear usuarios uno por uno
      let usuariosCreados = 0;
      for (const usuario of usuariosPrueba) {
        try {
          console.log(`📝 Creando usuario: ${usuario.email}`);
          await this.userService.addUser(usuario);
          usuariosCreados++;
          console.log(`✅ Usuario creado: ${usuario.email}`);
        } catch (error) {
          console.warn(`⚠️ Usuario ${usuario.email} ya existe o error:`, error);
        }
      }

      const tiempo = Date.now() - inicio;
      
      if (usuariosCreados > 0) {
        this.actualizarResultado('Usuarios de Prueba', 'exitoso', 
          `${usuariosCreados} usuarios creados exitosamente`, tiempo);

        // Mostrar resumen
        await Swal.fire({
          title: '✅ Usuarios Creados',
          html: `
            <div class="text-start">
              <p><strong>${usuariosCreados} usuarios creados exitosamente:</strong></p>
              <div class="alert alert-info">
                <strong>Credenciales de acceso:</strong><br>
                <small>Contraseña para todos: <strong>123456</strong></small>
              </div>
              <p><small class="text-muted">Los usuarios están listos para la presentación.</small></p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Perfecto'
        });
      } else {
        this.actualizarResultado('Usuarios de Prueba', 'error', 
          'No se pudieron crear usuarios (posiblemente ya existen)', tiempo);
      }

    } catch (error: any) {
      console.error('❌ Error creando usuarios de prueba:', error);
      
      await Swal.fire({
        title: 'Error',
        text: `Error: ${error.message || error}`,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      
      const tiempo = Date.now() - Date.now();
      this.actualizarResultado('Usuarios de Prueba', 'error', 
        `Error: ${error.message || error}`, tiempo);
    }
  }

  // --- MÉTODOS DE UTILIDAD ---

  /**
   * Agrega un nuevo resultado de prueba
   */
  private agregarResultado(nombre: string, estado: ResultadoPrueba['estado'], mensaje: string): void {
    const resultadosActuales = this.resultados();
    
    // Verificar si ya existe un resultado con el mismo nombre
    const indiceExistente = resultadosActuales.findIndex(r => r.nombre === nombre);
    
    if (indiceExistente !== -1) {
      // Si existe, actualizar el resultado existente
      resultadosActuales[indiceExistente] = { nombre, estado, mensaje };
      this.resultados.set([...resultadosActuales]);
    } else {
      // Si no existe, agregar nuevo resultado
      const nuevosResultados = [...resultadosActuales];
      nuevosResultados.push({ nombre, estado, mensaje });
      this.resultados.set(nuevosResultados);
    }
  }

  /**
   * Actualiza un resultado existente
   */
  private actualizarResultado(nombre: string, estado: ResultadoPrueba['estado'], mensaje: string, tiempo?: number): void {
    const resultados = this.resultados();
    const indice = resultados.findIndex(r => r.nombre === nombre);
    
    if (indice !== -1) {
      resultados[indice] = { nombre, estado, mensaje, tiempo };
      this.resultados.set([...resultados]);
    }
  }

  /**
   * Espera un tiempo determinado
   */
  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Muestra el resumen final de las pruebas
   */
  private mostrarResumenFinal(): void {
    const exitosas = this.contarExitosas();
    const fallidas = this.contarFallidas();
    const total = this.resultados().length;

    const titulo = exitosas === total ? '🎉 ¡Todas las pruebas exitosas!' : 
                   fallidas === 0 ? '✅ Pruebas completadas' : 
                   '⚠️ Algunas pruebas fallaron';

    Swal.fire({
      title: titulo,
      html: `
        <div class="text-start">
          <p><strong>Resumen de pruebas:</strong></p>
          <ul>
            <li>✅ Exitosas: ${exitosas}/${total}</li>
            <li>❌ Fallidas: ${fallidas}/${total}</li>
            <li>⏱️ Tiempo total: ${this.calcularTiempoTotal()}ms</li>
          </ul>
        </div>
      `,
      icon: exitosas === total ? 'success' : fallidas > 0 ? 'warning' : 'info',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Cuenta las pruebas exitosas
   */
  contarExitosas(): number {
    return this.resultados().filter(r => r.estado === 'exitoso').length;
  }

  /**
   * Cuenta las pruebas fallidas
   */
  contarFallidas(): number {
    return this.resultados().filter(r => r.estado === 'error').length;
  }

  /**
   * Calcula el tiempo total de todas las pruebas
   */
  calcularTiempoTotal(): number {
    return this.resultados().reduce((total, resultado) => {
      return total + (resultado.tiempo || 0);
    }, 0);
  }

  /**
   * Limpia todos los resultados
   */
  limpiarResultados(): void {
    this.resultados.set([]);
    this.progreso.set(0);
  }
}
