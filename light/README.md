# Terapia de Sonido Grupal — Benjamín Bautista

Landing page inmersiva de alta conversión y experiencia sensorial para las sesiones presenciales de Terapia de Sonido Grupal guiadas por Benjamín en Managua, Nicaragua.

🌐 **Sitio Web en Producción**: [yosoy.rastayogui.com](https://yosoy.rastayogui.com)

---

## ✨ Características Principales

- **Diseño Editorial Quiet Luxury**: Estética contemporánea *Dark Forest & Warm Gold* diseñada para transmitir calma, presencia y exclusividad.
- **Tibetan Bowl Sound Engine (Web Audio API)**: Motor de audio sintetizado con escala pentatónica en frecuencias armónicas (256Hz C4 a 576Hz D5 con armónicos y sobretonos) que responde al interactuar con botones y elementos interactivos.
- **Galería de Sesiones con Lightbox**: Cuadrícula responsive de 8 fotografías reales en alta definición con visor interactivo a pantalla completa, navegación por teclado (`←`, `→`, `Esc`) y gestos táctiles (*swipe*) en móviles.
- **Testimonios en Video**: Reproductores optimizados con posters de alta calidad y control de reproducción único.
- **Formulario Inteligente**:
  - Detección automática de prefijo internacional de país (`intl-tel-input`) vía IP y geolocalización.
  - Selector dinámico de fechas con estados de cupo y badges de urgencia (*Sold Out*, *Último Cupo*).
  - Selector de opciones de reserva/abono ($30, $50, $77 Pago Completo).
  - Integración directa con **GoHighLevel CRM API v2** (creación de contactos con tags y custom fields).
  - Integración de analítica con **Meta CAPI** (fbc, fbp, fbclid) y eventos en el **DataLayer de Google Tag Manager**.
- **Botón Flotante Inteligente**: CTA dinámico que aparece suavemente al hacer scroll y se oculta automáticamente al llegar al formulario.

---

## 📁 Estructura del Repositorio

```text
├── index.html          # Estructura principal y contenido de la landing page
├── style.css           # Sistema de diseño, layout responsive y estilos del lightbox
├── main.js             # Lógica de audio Web Audio API, formulario, CRM y lightbox
├── gracias.html        # Página de confirmación y agradecimiento post-registro
├── vercel.json         # Configuración de rutas y headers para Vercel
├── .gitignore          # Exclusión de archivos sensibles y temporales
├── gallery/            # Miniaturas y fotos HD de las sesiones de sonidoterapia
│   ├── sesion_foto_*_thumb.jpg
│   └── sesion_foto_*_large.jpg
├── videos/             # Videos testimoniales en formato MP4 y pósters optimizados
│   ├── highlights.mp4
│   ├── ruido_interno.mp4
│   └── testimonio_*.mp4
└── raw_assets/         # Archivos originales y grabaciones en crudo (ignorado en git)
```

---

## 🚀 Despliegue y Ejecución Local

### Ejecución Local
Puedes abrir `index.html` directamente en tu navegador o usar cualquier servidor estático local:

```bash
# Con npx serve
npx serve .

# O con Python 3
python3 -m http.server 3000
```

Visita `http://localhost:3000` en tu navegador.

### Despliegue en Vercel
Este proyecto está optimizado para desplegarse instantáneamente en Vercel:

```bash
vercel --prod
```

---

## 🛠️ Tecnologías

- **HTML5 Semántico** & **CSS3 Moderno** (CSS Grid, Flexbox, Variables CSS, Backdrop Filters).
- **JavaScript Moderno (ES6+)**.
- **Web Audio API** (Sintetizador polifónico nativo del navegador).
- **intl-tel-input** v24 (Selector internacional de teléfonos).
- **GoHighLevel CRM API v2** (LeadConnector).
- **Google Tag Manager** & **Meta Ads CAPI**.
- **Vercel** (Edge hosting & SSL).

---

Desarrollado con ❤️ para Benjamín Bautista.
