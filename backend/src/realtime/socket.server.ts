// src/realtime/socket.server.ts
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

export function createSocketServer(
  httpServer: HttpServer
): SocketServer<ClientToServerEvents, ServerToClientEvents> {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware — validate JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { id: socket.id, userId: socket.data.userId });

    socket.on('subscribe:greenhouse', (greenhouseId: string) => {
      socket.join(greenhouseId);
      logger.debug('Subscribed to greenhouse room', { socketId: socket.id, greenhouseId });
    });

    socket.on('unsubscribe:greenhouse', (greenhouseId: string) => {
      socket.leave(greenhouseId);
    });

    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { id: socket.id, reason });
    });
  });

  return io;
}
