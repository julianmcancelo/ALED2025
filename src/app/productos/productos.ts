import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  descuento?: number;
  imagen: string;
  categoria: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {
  // Productos destacados de ejemplo
  productosDestacados: Producto[] = [
    {
      id: 1,
      nombre: 'Auriculares Premium',
      precio: 15999,
      descuento: 31,
      imagen: 'assets/productos/auriculares.jpg',
      categoria: 'Audio'
    },
    {
      id: 2,
      nombre: 'Smartwatch Series 5',
      precio: 45999,
      descuento: 33,
      imagen: 'assets/productos/smartwatch.jpg',
      categoria: 'Tecnología'
    },
    {
      id: 3,
      nombre: 'Laptop Pro 15"',
      precio: 125999,
      descuento: 25,
      imagen: 'assets/productos/laptop.jpg',
      categoria: 'Computadoras'
    },
    {
      id: 4,
      nombre: 'Zapatillas Deportivas',
      precio: 12999,
      descuento: 33,
      imagen: 'assets/productos/zapatillas.jpg',
      categoria: 'Calzado'
    }
  ];

  // Índice actual del carousel
  currentSlideIndex = 0;

  // Banner slides
  bannerSlides = [
    {
      titulo: 'Moda para Todos',
      subtitulo: 'Nueva colección de temporada',
      imagen: 'assets/banners/moda.jpg'
    },
    {
      titulo: 'Tecnología Innovadora',
      subtitulo: 'Los mejores dispositivos del mercado',
      imagen: 'assets/banners/tecnologia.jpg'
    },
    {
      titulo: 'Ofertas Especiales',
      subtitulo: 'Hasta 50% de descuento',
      imagen: 'assets/banners/ofertas.jpg'
    }
  ];

  // Calcular precio con descuento
  calcularPrecioConDescuento(precio: number, descuento?: number): number {
    if (!descuento) return precio;
    return precio - (precio * descuento / 100);
  }

  // Navegación del carousel
  prevSlide(): void {
    this.currentSlideIndex = this.currentSlideIndex === 0 
      ? this.bannerSlides.length - 1 
      : this.currentSlideIndex - 1;
  }

  nextSlide(): void {
    this.currentSlideIndex = this.currentSlideIndex === this.bannerSlides.length - 1 
      ? 0 
      : this.currentSlideIndex + 1;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  // Navegación del carrusel de productos
  scrollProductos(direction: 'left' | 'right'): void {
    const container = document.querySelector('.productos-scroll') as HTMLElement;
    if (container) {
      const scrollAmount = 320; // ancho de tarjeta + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}