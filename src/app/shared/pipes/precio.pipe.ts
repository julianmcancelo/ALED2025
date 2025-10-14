import { Pipe, PipeTransform } from '@angular/core';

/**
 * ============================================================================
 * PIPE PERSONALIZADO - FORMATO DE PRECIO
 * ============================================================================
 * 
 * Convierte números a formato de precio argentino con símbolo de peso
 * y separadores de miles.
 * 
 * Ejemplo: 1500 -> "$1.500,00"
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

@Pipe({
  name: 'precio',
  standalone: true
})
export class PrecioPipe implements PipeTransform {

  /**
   * Transforma un número a formato de precio argentino
   * @param value - El valor numérico a transformar
   * @param simbolo - El símbolo de moneda (por defecto '$')
   * @param decimales - Número de decimales a mostrar (por defecto 2)
   * @returns String formateado como precio
   */
  transform(value: number | null | undefined, simbolo: string = '$', decimales: number = 2): string {
    // Validar entrada
    if (value === null || value === undefined || isNaN(value)) {
      return `${simbolo}0,00`;
    }

    // Convertir a número si es string
    const numero = typeof value === 'string' ? parseFloat(value) : value;

    // Formatear con separadores de miles y decimales
    const formatoArgentino = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
      useGrouping: true
    });

    const numeroFormateado = formatoArgentino.format(numero);
    
    return `${simbolo}${numeroFormateado}`;
  }
}
