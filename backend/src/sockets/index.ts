import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';

let io: Server | undefined;

/**
 * Initializes the Socket.io server on top of the existing HTTP server.
 * Clients join two kinds of rooms:
 *  - `station:<id>` to watch one station's live status
 *  - `session:<id>` to watch one active charging session tick
 * Controllers call the emit* helpers below after mutating the database so
 * every connected client sees the change without polling the REST API.
 */
export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('station:watch', (stationId: string) => socket.join(`station:${stationId}`));
    socket.on('station:unwatch', (stationId: string) => socket.leave(`station:${stationId}`));
    socket.on('session:watch', (sessionId: string) => socket.join(`session:${sessionId}`));
    socket.on('session:unwatch', (sessionId: string) => socket.leave(`session:${sessionId}`));
  });

  return io;
}

export function emitStationUpdate(stationId: string, payload: unknown) {
  io?.to(`station:${stationId}`).emit('station:update', payload);
  io?.emit('station:list-update', { stationId, ...Object(payload) });
}

export function emitSessionUpdate(sessionId: string, payload: unknown) {
  io?.to(`session:${sessionId}`).emit('session:update', payload);
}
