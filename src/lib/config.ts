// Configuración para el sistema de chat
export const CHAT_CONFIG = {
  // URL del servidor WebSocket para producción
  // Para GitHub Pages, necesitarás un servidor WebSocket externo
  // Puedes usar servicios como:
  // - Heroku (gratis con limitaciones)
  // - Vercel Serverless Functions
  // - Replit
  // - Glitch
  // - Cualquier servicio que soporte Node.js y WebSockets
  
  // URL del servidor WebSocket (cámbiala por tu servidor externo)
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  
  // Opciones de conexión
  SOCKET_OPTIONS: {
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
    timeout: 20000,
    retries: 3
  },
  
  // Configuración para fallback cuando WebSocket no está disponible
  FALLBACK: {
    enabled: true,
    pollingInterval: 3000, // 3 segundos
    maxRetries: 5
  },
  
  // Mensajes del sistema
  SYSTEM_MESSAGES: {
    WELCOME: '¡Bienvenido al chat!',
    USER_JOINED: 'se unió al chat',
    USER_LEFT: 'abandonó el chat',
    DISCONNECTED: 'Conexión perdida. Intentando reconectar...',
    RECONNECTED: 'Conexión restablecida'
  }
};

// Función para determinar si estamos en GitHub Pages
export const isGitHubPages = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
};

// Función para obtener la URL del socket según el entorno
export const getSocketUrl = (): string => {
  if (isGitHubPages()) {
    // En GitHub Pages, usar un servidor externo
    return process.env.NEXT_PUBLIC_SOCKET_URL || 'https://tu-servidor-externo.com';
  }
  
  // En desarrollo o producción normal, usar el mismo origen
  return process.env.NEXT_PUBLIC_SOCKET_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
};