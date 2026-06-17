# --- Fase 1: Build del Frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copiar archivos de dependencias
COPY frontend/package*.json ./
RUN npm install

# Copiar el resto del código del frontend y hacer el build
COPY frontend/ ./
RUN npm run build


# --- Fase 2: Setup del Backend y Producción ---
FROM node:20-alpine
WORKDIR /app/backend

# Copiar archivos de dependencias
COPY backend/package*.json ./

# Instalar únicamente dependencias de producción
RUN npm install --omit=dev
RUN npm install jsonwebtoken

# Copiar el resto del código del backend
COPY backend/ ./

# Crear la carpeta public y copiar los archivos estáticos desde la Fase 1
RUN mkdir -p public
COPY --from=frontend-build /app/frontend/dist ./public

# Exponer el puerto estándar
EXPOSE 5000

# Arrancar el servidor de Node
CMD ["node", "server.js"]
