import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      // If a specific callback is provided, remove that one; otherwise remove all listeners for the event
      // @ts-expect-error socket.io types allow optional listener
      this.socket.off(event, callback as any);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinContact(contactId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_contact', contactId);
    }
  }

  leaveContact(contactId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_contact', contactId);
    }
  }

  onSmsSent(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('sms_sent', callback);
    }
  }

  onSmsDeliveryUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('sms_delivery_update', callback);
    }
  }

  offSmsSent() {
    if (this.socket) {
      this.socket.off('sms_sent');
    }
  }

  offSmsDeliveryUpdate() {
    if (this.socket) {
      this.socket.off('sms_delivery_update');
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;
