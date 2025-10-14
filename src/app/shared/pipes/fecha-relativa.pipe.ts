import { Pipe, PipeTransform } from '@angular/core';

/**
 * ============================================================================
 * PIPE PERSONALIZADO - FECHA RELATIVA
 * ============================================================================
 * 
 * Convierte fechas a formato relativo en español
 * (hace 2 días, hace 1 semana, etc.)
 * 
 * Ejemplo: new Date() -> "Ahora"
 *          fecha de ayer -> "Hace 1 día"
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

@Pipe({
  name: 'fechaRelativa',
  standalone: true
})
export class FechaRelativaPipe implements PipeTransform {

  /**
   * Transforma una fecha a formato relativo en español
   * @param value - La fecha a transformar (Date, string o timestamp)
   * @returns String con el tiempo relativo
   */
  transform(value: Date | string | number | null | undefined): string {
    if (!value) {
      return 'Fecha no disponible';
    }

    // Convertir a Date si es necesario
    let fecha: Date;
    
    if (value instanceof Date) {
      fecha = value;
    } else if (typeof value === 'string') {
      fecha = new Date(value);
    } else if (typeof value === 'number') {
      fecha = new Date(value);
    } else {
      return 'Fecha inválida';
    }

    // Validar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      return 'Fecha inválida';
    }

    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    
    // Convertir a diferentes unidades
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    const años = Math.floor(dias / 365);

    // Determinar el formato apropiado
    if (segundos < 60) {
      return segundos <= 5 ? 'Ahora' : `Hace ${segundos} segundos`;
    } else if (minutos < 60) {
      return minutos === 1 ? 'Hace 1 minuto' : `Hace ${minutos} minutos`;
    } else if (horas < 24) {
      return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
    } else if (dias < 7) {
      return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
    } else if (semanas < 4) {
      return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
    } else if (meses < 12) {
      return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
    } else {
      return años === 1 ? 'Hace 1 año' : `Hace ${años} años`;
    }
  }
}
