# Despliegue en GitHub Pages - Sistema de Chat en Tiempo Real

## Resumen

Este sistema de chat está diseñado para funcionar tanto en un entorno de desarrollo local con Next.js como en GitHub Pages. Sin embargo, GitHub Pages es un servicio de hosting estático y no puede ejecutar servidores WebSocket directamente, por lo que necesitarás configurar un servidor WebSocket externo.

## Arquitectura del Sistema

### Componentes

1. **Frontend (React + Next.js)**: Interfaz de usuario del chat
2. **Backend WebSocket**: Servidor de WebSocket para manejar las conexiones en tiempo real
3. **Configuración Multi-entorno**: Soporte para desarrollo local y GitHub Pages

### Flujo de Datos

```
Usuario 1 ↔ Frontend ↔ Servidor WebSocket ↔ Frontend ↔ Usuario 2
```

## Despliegue en GitHub Pages

### Paso 1: Construir el proyecto estático

```bash
# Construir el proyecto para producción
npm run build

# Exportar como sitio estático
npm run export
```

### Paso 2: Configurar GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los archivos de la carpeta `out` (generada por `npm run export`)
3. Configura GitHub Pages en la rama `gh-pages` o `main`

### Paso 3: Configurar el servidor WebSocket externo

Debido a que GitHub Pages no puede ejecutar servidores WebSocket, necesitas desplegar el servidor WebSocket en un servicio externo. Aquí tienes algunas opciones:

#### Opción 1: Heroku (Gratis con limitaciones)

1. Crea una cuenta en [Heroku](https://heroku.com)
2. Instala la CLI de Heroku: `npm install -g heroku`
3. Crea un nuevo app: `heroku create nombre-de-tu-app`
4. Despliega el servidor WebSocket:

```bash
# Clona este repositorio
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio

# Inicializa Heroku
heroku git:remote -a nombre-de-tu-app

# Despliega
git push heroku main
```

#### Opción 2: Vercel Serverless Functions

1. Crea una cuenta en [Vercel](https://vercel.com)
2. Crea un nuevo proyecto
3. Configura las Serverless Functions para WebSocket

#### Opción 3: Replit

1. Crea una cuenta en [Replit](https://replit.com)
2. Crea un nuevo repl con Node.js
3. Sube el código del servidor WebSocket
4. Configura el repl para que siempre esté activo

#### Opción 4: Glitch

1. Crea una cuenta en [Glitch](https://glitch.com)
2. Importa el proyecto o crea uno nuevo
3. Glitch proporciona una URL pública automáticamente

## Configuración del Servidor WebSocket Externo

### Archivo del Servidor WebSocket

Crea un archivo `server-socket.js` con el siguiente contenido:

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('setUsername', (username) => {
    const user = {
      id: socket.id,
      name: username
    };
    
    users.set(socket.id, user);
    
    io.emit('userJoined', user);
    io.emit('userList', Array.from(users.values()));
    
    socket.emit('message', {
      text: `¡Bienvenido al chat, ${username}!`,
      senderId: 'system',
      senderName: 'Sistema',
      timestamp: new Date().toISOString(),
      type: 'system'
    });
    
    socket.broadcast.emit('message', {
      text: `${username} se unió al chat`,
      senderId: 'system',
      senderName: 'Sistema',
      timestamp: new Date().toISOString(),
      type: 'join'
    });
  });
  
  socket.on('message', (msg) => {
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      io.emit('userLeft', user);
      io.emit('userList', Array.from(users.values()));
      
      socket.broadcast.emit('message', {
        text: `${user.name} abandonó el chat`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'leave'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

### package.json para el servidor

```json
{
  "name": "chat-websocket-server",
  "version": "1.0.0",
  "main": "server-socket.js",
  "scripts": {
    "start": "node server-socket.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5"
  }
}
```

## Configuración del Frontend para GitHub Pages

### Variables de Entorno

Crea un archivo `.env.local` en tu proyecto frontend:

```env
NEXT_PUBLIC_SOCKET_URL=https://tu-servidor-externo.com
```

### Configuración de Next.js para Exportación Estática

Asegúrate de que tu `next.config.ts` esté configurado para exportación estática:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
```

## Instrucciones para el Usuario Final

### Para el Desarrollador

1. **Desarrollo Local**:
   ```bash
   npm install
   npm run dev
   ```
   El chat funcionará en `http://localhost:3000`

2. **Despliegue en Producción**:
   - Despliega el frontend en GitHub Pages
   - Despliega el servidor WebSocket en un servicio externo
   - Configura la variable de entorno `NEXT_PUBLIC_SOCKET_URL`

### Para el Usuario Final

1. **Acceso al Chat**:
   - Abre la URL de GitHub Pages en tu navegador
   - Ingresa tu nombre de usuario
   - Comienza a chatear con otros usuarios conectados

2. **Requisitos**:
   - Navegador web moderno con soporte para WebSocket
   - Conexión a internet estable
   - El servidor WebSocket debe estar en línea

## Solución de Problemas

### Problemas Comunes

1. **"No se puede conectar al servidor"**:
   - Verifica que el servidor WebSocket esté en línea
   - Confirma que la URL del servidor es correcta
   - Revisa la consola del navegador para ver errores

2. **"Los mensajes no se envían"**:
   - Asegúrate de que estás conectado (ícono verde)
   - Verifica tu conexión a internet
   - Intenta recargar la página

3. **"Modo alternativo activo"**:
   - El sistema está usando un fallback porque WebSocket no está disponible
   - Algunas funciones pueden estar limitadas
   - Considera usar un navegador diferente o verificar tu conexión

### Monitoreo y Logs

- **Servidor WebSocket**: Revisa los logs en tu servicio de hosting
- **Frontend**: Usa la consola del navegador (F12) para ver errores
- **Conexión**: Verifica el estado de conexión en la interfaz del chat

## Seguridad Considerations

1. **Validación de Entrada**: El servidor valida todos los mensajes entrantes
2. **CORS Configurado**: Solo permite orígenes específicos
3. **Rate Limiting**: Considera implementar límites de velocidad
4. **HTTPS**: Usa siempre HTTPS en producción

## Mejoras Futuras

1. **Persistencia de Mensajes**: Almacenar mensajes en una base de datos
2. **Salas de Chat**: Permitir crear y unirse a diferentes salas
3. **Autenticación**: Sistema de login con JWT
4. **Archivos Compartidos**: Permitir compartir imágenes y archivos
5. **Notificaciones**: Notificaciones de escritorio para nuevos mensajes

## Soporte

Si tienes problemas o preguntas:
1. Revisa esta documentación
2. Verifica los logs del servidor y del cliente
3. Abre un issue en el repositorio del proyecto