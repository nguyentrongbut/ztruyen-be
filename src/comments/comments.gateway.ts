// ** Nestjs
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

// ** Socket
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CommentsGateway {

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-chapter')
  joinChapter(
    @ConnectedSocket() client: Socket,
    @MessageBody() chapterId: string,
  ) {
    client.join(`chapter-${chapterId}`);
  }

  @SubscribeMessage('join-comic')
  joinComic(
    @ConnectedSocket() client: Socket,
    @MessageBody() slug: string,
  ) {
    client.join(`comic-${slug}`);
  }

  @SubscribeMessage('join-user')
  joinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    client.join(`user-${userId}`);
  }

  broadcastComment(comment: any) {

    this.server
      .to(`chapter-${comment.chapter_id}`)
      .emit('new-comment', comment);

    this.server
      .to(`comic-${comment.comic_slug}`)
      .emit('new-comment', comment);
  }

  notifyUser(userId: string, data: any) {
    this.server
      .to(`user-${userId}`)
      .emit('notification', data);
  }
}