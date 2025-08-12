import { Server } from 'socket.io';

interface User {
  id: string;
  name: string;
}

interface Message {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'message' | 'system' | 'join' | 'leave';
}

export const setupSocket = (io: Server) => {
  const users = new Map<string, User>();
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle username setting
    socket.on('setUsername', (username: string) => {
      const user: User = {
        id: socket.id,
        name: username
      };
      
      users.set(socket.id, user);
      
      // Notify all clients about the new user
      io.emit('userJoined', user);
      
      // Send current user list to all clients
      io.emit('userList', Array.from(users.values()));
      
      // Send welcome message to the new user
      socket.emit('message', {
        text: `¡Bienvenido al chat, ${username}!`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
      
      // Notify others about the new user
      socket.broadcast.emit('message', {
        text: `${username} se unió al chat`,
        senderId: 'system',
        senderName: 'Sistema',
        timestamp: new Date().toISOString(),
        type: 'join'
      });
    });
    
    // Handle messages
    socket.on('message', (msg: Message) => {
      // Broadcast message to all connected clients
      io.emit('message', msg);
    });

    // Handle private messages (if needed in the future)
    socket.on('privateMessage', ({ targetUserId, message }: { targetUserId: string; message: Message }) => {
      const targetSocket = io.sockets.sockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit('message', {
          ...message,
          text: `[Privado] ${message.text}`
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      const user = users.get(socket.id);
      if (user) {
        // Remove user from the list
        users.delete(socket.id);
        
        // Notify all clients about the user leaving
        io.emit('userLeft', user);
        io.emit('userList', Array.from(users.values()));
        
        // Notify others about the user leaving
        socket.broadcast.emit('message', {
          text: `${user.name} abandonó el chat`,
          senderId: 'system',
          senderName: 'Sistema',
          timestamp: new Date().toISOString(),
          type: 'leave'
        });
      }
    });

    // Handle request for user list
    socket.on('getUserList', () => {
      socket.emit('userList', Array.from(users.values()));
    });
  });
};