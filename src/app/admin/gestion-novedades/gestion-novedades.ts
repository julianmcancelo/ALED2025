import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NovedadesService, Novedad } from '../../servicios/novedades.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-novedades.html',
  styleUrls: ['./gestion-novedades.css'],
})
export class GestionNovedadesComponent implements OnInit {
  private novedadesService = inject(NovedadesService);

  novedades$!: Observable<Novedad[]>;
  mostrarFormulario = false;
  novedadActual: Partial<Novedad> = {};
  esModoEdicion = false;

  ngOnInit(): void {
    this.novedades$ = this.novedadesService.getNovedades();
  }

  iniciarNuevo(): void {
    this.esModoEdicion = false;
    this.novedadActual = { titulo: '', descripcion: '', imagenUrl: '', enlaceUrl: '' };
    this.mostrarFormulario = true;
  }

  iniciarEdicion(novedad: Novedad): void {
    this.esModoEdicion = true;
    this.novedadActual = { ...novedad };
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
  }

  async guardarNovedad(): Promise<void> {
    if (!this.novedadActual.titulo || !this.novedadActual.imagenUrl) {
      Swal.fire('Error', 'El título y la URL de la imagen son obligatorios.', 'error');
      return;
    }

    try {
      if (this.esModoEdicion && this.novedadActual.id) {
        await this.novedadesService.actualizarNovedad(this.novedadActual.id, this.novedadActual);
        Swal.fire('¡Actualizado!', 'La novedad ha sido actualizada.', 'success');
      } else {
        await this.novedadesService.crearNovedad(this.novedadActual as Novedad);
        Swal.fire('¡Creado!', 'La nueva novedad ha sido creada.', 'success');
      }
      this.mostrarFormulario = false;
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar la novedad.', 'error');
    }
  }

  async eliminarNovedad(id: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
    });

    if (result.isConfirmed) {
      try {
        await this.novedadesService.eliminarNovedad(id);
        Swal.fire('¡Eliminado!', 'La novedad ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la novedad.', 'error');
      }
    }
  }
}
