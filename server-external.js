// Servidor WebSocket externo para GitHub Pages
// Este archivo puede ser desplegado en servicios como Heroku, Vercel, Replit, etc.

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

// Almacenamiento de usuarios conectados
const users = new Map();

// Eventos de conexión
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  // Establecer nombre de usuario
  socket.on('setUsername', (username) => {
    // Validar que el nombre no esté vacío
    if (!username || username.trim().length === 0) {
      socket.emit('message', {
        text: 'Por favor ingresa un nombre válido',
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
      return;
    }

    // Limitar longitud del nombre
    const cleanUsername = username.trim().substring(0, 20);
    
    const user = {
      id: socket.id,
      name: cleanUsername
    };
    
    users.set(socket.id, user);
    
    // Notificar a todos sobre el nuevo usuario
    io.emit('userJoined', user);
    io.emit('userList', Array.from(users.values()));
    
    // Mensaje de bienvenida
    socket.emit('message', {
      text: `¡Bienvenido al chat, ${cleanUsername}!`,
      senderId: 'system',
      senderName: 'Sistema',
      timestamp: new Date().toISOString(),
      type: 'system'
    });
    
    // Notificar a otros usuarios
    socket.broadcast.emit('message', {
      text: `${cleanUsername} se unió al chat`,
      senderId: 'system',
      senderName: 'Sistema',
      timestamp: new Date().toISOString(),
      type: 'join'
    });
    
    console.log(`👤 User "${cleanUsername}" connected with ID: ${socket.id}`);
  });
  
  // Manejar mensajes
  socket.on('message', (msg) => {
    // Validar mensaje
    if (!msg || !msg.text || msg.text.trim().length === 0) {
      return;
    }
    
    // Limitar longitud del mensaje
    const cleanText = msg.text.trim().substring(0, 500);
    
    // Crear mensaje limpio
    const cleanMessage = {
      ...msg,
      text: cleanText,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast a todos los clientes conectados
    io.emit('message', cleanMessage);
    
    console.log(`💬 Message from ${msg.senderName}: ${cleanText}`);
  });

  // Manejar mensajes privados (opcional)
  socket.on('privateMessage', ({ targetUserId, message }) => {
    const targetSocket = io.sockets.sockets.get(targetUserId);
    if (targetSocket) {
      targetSocket.emit('message', {
        ...message,
        text: `[Privado de ${message.senderName}] ${message.text}`
      });
      console.log(`🔒 Private message from ${message.senderName} to user ${targetUserId}`);
    }
  });

  // Solicitar lista de usuarios
  socket.on('getUserList', () => {
    socket.emit('userList', Array.from(users.values()));
  });

  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Notificar a todos sobre el usuario que se fue
      io.emit('userLeft', user);
      io.emit('userList', Array.from(users.values()));
      
      // Notificar a otros usuarios
      socket.broadcast.emit('message', {
        text: `${user.name} abandonó el chat`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'leave'
      });
      
      console.log(`👋 User "${user.name}" disconnected`);
    }
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedUsers: users.size,
    users: Array.from(users.values())
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'WebSocket Chat Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      websocket: '/socket.io/'
    },
    connectedUsers: users.size
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 WebSocket server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket endpoint: ws://${HOST}:${PORT}/socket.io/`);
  console.log(`🌐 CORS enabled for all origins`);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});