# 🎨 Sistema de Diseño - ALED 2025

## Paleta de Colores

### Colores Principales
- **Primary**: `#00a8cc` (Cian/Turquesa)
- **Primary Dark**: `#007a99` (Cian Oscuro)
- **Primary Light**: `#33bbd6` (Cian Claro)
- **Secondary**: `#005f73` (Azul Oscuro)
- **Accent**: `#0a9396` (Verde Azulado)

### Colores Neutros
- **Gray Light**: `#f8f9fa`
- **Gray**: `#6c757d`
- **Gray Dark**: `#343a40`

---

## 🔘 Botones

### Botón Principal
```html
<button class="btn-primary">Texto del Botón</button>
```
- Fondo: Cian (#00a8cc)
- Hover: Cian oscuro (#007a99)
- Sombra y efecto de elevación

### Botón Secundario
```html
<button class="btn-secondary">Texto del Botón</button>
```
- Fondo: Gris (#6c757d)
- Hover: Gris oscuro

### Botón Outline
```html
<button class="btn-outline">Texto del Botón</button>
```
- Borde gris
- Hover: Fondo gris claro

---

## 📦 Cards (Tarjetas)

### Card Básica
```html
<div class="card">
  <div class="card-header">
    Título de la Card
  </div>
  <div class="card-body">
    Contenido de la card
  </div>
</div>
```

### Características
- **card**: Sombra, bordes redondeados, hover effect
- **card-header**: Gradiente cian, texto blanco
- **card-body**: Padding de 1.5rem

---

## 📝 Formularios

### Input
```html
<label class="form-label">Nombre del Campo</label>
<input type="text" class="form-input" placeholder="Ingresa texto">
```

### Características
- Bordes redondeados
- Focus: Borde cian con ring
- Transiciones suaves

---

## 🏷️ Badges

### Badge Principal
```html
<span class="badge-primary">Nuevo</span>
```

### Badge Secundario
```html
<span class="badge-secondary">Categoría</span>
```

---

## 📊 Tablas

```html
<table class="table-custom">
  <thead>
    <tr>
      <th>Columna 1</th>
      <th>Columna 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dato 1</td>
      <td>Dato 2</td>
    </tr>
  </tbody>
</table>
```

### Características
- Header: Fondo cian
- Hover: Fondo gris claro en filas
- Bordes sutiles

---

## 🔗 Links

```html
<a href="#" class="link-primary">Enlace</a>
```
- Color: Cian
- Hover: Cian oscuro

---

## ⚠️ Alertas

### Success
```html
<div class="alert-success">
  Operación exitosa
</div>
```

### Error
```html
<div class="alert-error">
  Error en la operación
</div>
```

### Info
```html
<div class="alert-info">
  Información importante
</div>
```

---

## 📐 Layout

### Container Principal
```html
<div class="container-custom">
  <!-- Contenido -->
</div>
```
- Max-width: 7xl (1280px)
- Padding responsive

### App Container
```html
<div class="app-container">
  <!-- Contenido de la app -->
</div>
```
- Flex column
- Min-height: 100vh
- Fondo: Gris claro

---

## 🎭 Estados de Carga

### Skeleton
```html
<div class="skeleton h-4 w-full"></div>
```
- Animación de pulso
- Fondo gris

---

## 🎯 Uso en Tailwind

Puedes combinar las clases del sistema con Tailwind:

```html
<button class="btn-primary w-full mt-4">
  Botón de ancho completo con margen superior
</button>
```

---

## 📱 Responsive

Todas las clases son responsive por defecto. Usa los breakpoints de Tailwind:

- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

Ejemplo:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Cards responsive -->
</div>
```

---

## ✨ Mejores Prácticas

1. **Consistencia**: Usa siempre las clases del sistema de diseño
2. **Colores**: Usa `#00a8cc` para elementos principales
3. **Espaciado**: Usa múltiplos de 4 (4px, 8px, 12px, 16px...)
4. **Transiciones**: Todas las interacciones deben tener transiciones suaves
5. **Accesibilidad**: Mantén contraste adecuado y usa labels semánticos

---

## 🚀 Componentes Actualizados

Los siguientes componentes ya usan el sistema de diseño:

- ✅ Header/Navbar
- ✅ Modales de Login/Registro
- ✅ Tienda/Productos
- ✅ Home
- ✅ Footer

---

## 📝 Notas

- Los warnings de `@tailwind` y `@apply` en el CSS son normales y no afectan la funcionalidad
- El sistema está optimizado para usar con Tailwind CSS + Bootstrap
- Todos los colores están centralizados en `styles.css`
