# 🌍 TripWise

**TripWise** es una aplicación web desarrollada durante un *Hackathon* que facilita la planificación de viajes de forma rápida, visual y centralizada. Permite consultar información útil sobre cualquier ubicación del mundo combinando datos de múltiples fuentes públicas a través de APIs.

---

## ✨ Funcionalidades

🔎 **Buscador inteligente de ubicaciones**  
Introduce el nombre de una ciudad o lugar de interés y recibe sugerencias en tiempo real gracias al autocompletado.

📌 **Resumen visual de la ubicación**  
Muestra la dirección completa, el tipo de lugar (atracción turística, restaurante, etc.), valoración de Google Maps e imagen representativa.

📖 **Descripción completa**  
Extraída directamente de Wikipedia, esta sección ofrece una descripción más extensa del lugar buscado.

🌦️ **Clima actual**  
Consulta información meteorológica en tiempo real: temperatura, condiciones del clima, humedad, viento y sensación térmica.

🗺️ **Mapa interactivo con puntos de interés**  
Visualiza la ubicación directamente en un mapa interactivo, con pins que destacan restaurantes, hoteles, parkings y más. Permite activar y desactivar capas según tus preferencias.

---

## 🧠 Objetivo del proyecto

TripWise nace de la necesidad de contar con una **plataforma única** que permita planificar viajes desde un solo lugar, sin tener que saltar entre varias webs. Nuestro objetivo fue crear una interfaz **intuitiva**, **visual** y **multilingüe**, reuniendo la información esencial sobre cualquier ubicación en una sola pantalla.

---

## 🌐 Tecnologías utilizadas

- 🔥 **Frontend:** Astro + React  
- 🎨 **Estilos:** Tailwind CSS  
- ⚙️ **Backend:** Python  
- 🗺️ **APIs externas:**
  - Google Maps API  
  - Google Places API  
  - AccuWeather API  
  - DeepL API (traducción automática)
  - Wikipedia

---

## 🚀 Cómo empezar

1. Clona el repositorio:
   ```bash
   git clone https://github.com/MC4MP02/tripwise.git
   ```

2. Accede a la carpeta del proyecto:
   ```bash
   cd tripwise/frontendAstro
   ```

3. Instala las dependencias:
   ```bash
   pnpm install
   ```

4. Inicia la aplicación en modo desarrollo:
   ```bash
   pnpm run dev
   ```

5. Inicia el backend:
   ```bash
   pyhton app.py
   ```

> 💡 Asegúrate de configurar tus claves de API correctamente en el archivo `.env` o en la configuración correspondiente del proyecto.

---

## 👥 Autores

Proyecto desarrollado durante el Hackathon por:

- Marc [@MC4MP02](https://github.com/MC4MP02)  
- Pol [@polcaparross](https://github.com/polcaparross)
- Adil [@1635070](https://github.com/1635070)
- Pau [@Leyva03](https://github.com/Leyva03)

---

> ⭐ Si te ha gustado el proyecto, ¡no olvides dejar una estrella en GitHub!
