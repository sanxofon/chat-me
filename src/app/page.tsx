'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, MessageSquare, Send, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

type Message = {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'message' | 'system' | 'join' | 'leave';
}

type User = {
  id: string;
  name: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    socket,
    isConnected,
    connectionError,
    isUsingFallback,
    isGitHubPages
  } = useSocket({
    autoConnect: true,
    enableFallback: true
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleUserList = (users: User[]) => {
      setOnlineUsers(users);
    };

    const handleUserJoined = (user: User) => {
      setMessages(prev => [...prev, {
        text: `${user.name} se unió al chat`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'join'
      }]);
    };

    const handleUserLeft = (user: User) => {
      setMessages(prev => [...prev, {
        text: `${user.name} abandonó el chat`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'leave'
      }]);
    };

    // Registrar event listeners
    socket.on('message', handleMessage);
    socket.on('userList', handleUserList);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    // Cleanup
    return () => {
      socket.off('message', handleMessage);
      socket.off('userList', handleUserList);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket]);

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos mensajes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUsernameSubmit = () => {
    if (username.trim() && socket) {
      socket.emit('setUsername', username.trim());
      setIsUsernameSet(true);
    }
  };

  const sendMessage = () => {
    if (socket && isConnected && inputMessage.trim()) {
      const messageData = {
        text: inputMessage.trim(),
        senderId: socket.id,
        senderName: username,
        timestamp: new Date().toISOString(),
        type: 'message' as const
      };
      
      setMessages(prev => [...prev, messageData]);
      socket.emit('message', messageData);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isUsernameSet) {
        handleUsernameSubmit();
      } else {
        sendMessage();
      }
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Chat en Tiempo Real
            </CardTitle>
            <p className="text-gray-600">Ingresa tu nombre para comenzar a chatear</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGitHubPages && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Estás en GitHub Pages. Para que el chat funcione, necesitas configurar un servidor WebSocket externo.
                </AlertDescription>
              </Alert>
            )}
            
            {connectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {connectionError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Tu nombre:
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej: Juan, María..."
                maxLength={20}
                disabled={!isConnected && !isUsingFallback}
              />
            </div>
            <Button 
              onClick={handleUsernameSubmit} 
              disabled={!username.trim() || (!isConnected && !isUsingFallback)}
              className="w-full"
            >
              Unirse al Chat
            </Button>
            <div className="flex items-center justify-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Conectado</span>
                </>
              ) : isUsingFallback ? (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">Modo alternativo</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Desconectado</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chat en Tiempo Real</h1>
                <p className="text-sm text-gray-600">Bienvenido, {username}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <Badge variant="secondary">
                  {onlineUsers.length} en línea
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Conectado</span>
                  </>
                ) : isUsingFallback ? (
                  <>
                    <WifiOff className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Modo alternativo</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Desconectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {connectionError && (
            <Alert className="mt-2" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionError}
              </AlertDescription>
            </Alert>
          )}
          
          {isGitHubPages && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Modo GitHub Pages: Algunas funciones pueden estar limitadas. Para experiencia completa, 
                configura un servidor WebSocket externo.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-4">
          {/* Chat area */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Mensajes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 px-4 pb-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay mensajes aún. ¡Sé el primero en saludar!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.senderId === socket?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.type === 'system' || msg.type === 'join' || msg.type === 'leave'
                              ? 'bg-gray-100 text-gray-600 text-sm'
                              : msg.senderId === socket?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border text-gray-900'
                          }`}
                        >
                          {msg.type !== 'system' && msg.type !== 'join' && msg.type !== 'leave' && (
                            <div className="text-xs opacity-75 mb-1">
                              {msg.senderName}
                            </div>
                          )}
                          <div className="text-sm">{msg.text}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    disabled={!isConnected && !isUsingFallback}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={(!isConnected && !isUsingFallback) || !inputMessage.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users sidebar */}
          <Card className="w-64">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios en línea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay usuarios conectados</p>
                  ) : (
                    onlineUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-2 p-2 rounded ${
                          user.id === socket?.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className={`text-sm ${
                          user.id === socket?.id ? 'font-medium text-blue-600' : 'text-gray-700'
                        }`}>
                          {user.name}
                          {user.id === socket?.id && ' (tú)'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}