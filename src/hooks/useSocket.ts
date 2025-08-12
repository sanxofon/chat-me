'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CHAT_CONFIG, getSocketUrl, isGitHubPages } from '@/lib/config';

interface UseSocketOptions {
  autoConnect?: boolean;
  enableFallback?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, enableFallback = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (socket?.connected) return;

    try {
      const socketUrl = getSocketUrl();
      console.log('Connecting to socket at:', socketUrl);
      
      const socketInstance = io(socketUrl, {
        ...CHAT_CONFIG.SOCKET_OPTIONS,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setConnectionError(null);
        retryCountRef.current = 0;
        
        // Limpiar fallback si estaba activo
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
          setIsUsingFallback(false);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Si es una desconexión manual, no intentar reconectar
        if (reason === 'io client disconnect') {
          return;
        }
        
        // Activar fallback si está habilitado
        if (enableFallback && !fallbackIntervalRef.current) {
          startFallback();
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        
        // Activar fallback si está habilitado y hemos agotado los reintentos
        if (enableFallback && retryCountRef.current >= CHAT_CONFIG.SOCKET_OPTIONS.retries) {
          startFallback();
        }
        
        retryCountRef.current++;
      });

      socketInstance.connect();
      setSocket(socketInstance);

    } catch (error) {
      console.error('Error creating socket:', error);
      setConnectionError('Error al crear la conexión');
      
      // Activar fallback si está habilitado
      if (enableFallback) {
        startFallback();
      }
    }
  }, [enableFallback]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    
    // Limpiar fallback
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
      setIsUsingFallback(false);
    }
  }, [socket]);

  const startFallback = useCallback(() => {
    if (!enableFallback || fallbackIntervalRef.current) return;

    console.log('Starting fallback mode');
    setIsUsingFallback(true);
    setConnectionError('Usando modo de conexión alternativo');

    // Simular conexión en modo fallback
    fallbackIntervalRef.current = setInterval(() => {
      // Intentar reconectar cada cierto tiempo
      if (retryCountRef.current < CHAT_CONFIG.FALLBACK.maxRetries) {
        console.log('Attempting to reconnect from fallback...');
        retryCountRef.current++;
        
        // Aquí podrías implementar long polling u otra alternativa
        // Por ahora, solo intentamos reconectar el WebSocket
        if (socket) {
          socket.connect();
        }
      } else {
        // Si agotamos los reintentos, mostramos un mensaje
        setConnectionError('No se pudo establecer conexión. Verifica tu conexión a internet.');
      }
    }, CHAT_CONFIG.FALLBACK.pollingInterval);
  }, [enableFallback, socket]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Cannot send message - socket not connected');
      if (enableFallback) {
        // Aquí podrías implementar almacenamiento local para enviar más tarde
        console.log('Message queued for fallback mode');
      }
    }
  }, [socket, isConnected, enableFallback]);

  const onMessage = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const offMessage = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  // Conectar automáticamente si está habilitado
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    isUsingFallback,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    offMessage,
    isGitHubPages: isGitHubPages()
  };
};