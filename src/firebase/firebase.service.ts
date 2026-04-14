// ** NestJS
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Firebase
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length) return;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.config
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });

    this.logger.log('Firebase Admin initialized');
  }

  /**
   * Gửi FCM đến nhiều token cùng lúc (multi-device).
   * Tự động gọi onExpiredTokens callback với danh sách token hết hạn để caller cleanup.
   */
  async sendToTokens(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
    onExpiredTokens?: (expiredTokens: string[]) => Promise<void>,
  ): Promise<void> {
    if (!tokens.length) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      data: {
        title: payload.title,
        body: payload.body,
        ...(payload.data ?? {}),
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const expiredTokens: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        this.logger.warn(
          `FCM failed token[${idx}]: ${res.error?.code} — ${res.error?.message}`,
        );
        if (
          res.error?.code === 'messaging/registration-token-not-registered' ||
          res.error?.code === 'messaging/invalid-registration-token'
        ) {
          expiredTokens.push(tokens[idx]);
        }
      }
    });

    if (expiredTokens.length && onExpiredTokens) {
      await onExpiredTokens(expiredTokens).catch((err) =>
        this.logger.error('Cleanup expired FCM tokens failed', err),
      );
      this.logger.log(
        `Cleaned up ${expiredTokens.length} expired FCM token(s)`,
      );
    }
  }

  /**
   * Gửi FCM topic broadcast — dùng cho thông báo toàn hệ thống.
   * Client subscribe topic 'global' khi mở app (không cần login).
   */
  async sendToTopic(
    topic: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<void> {
    const message: admin.messaging.Message = {
      topic,
      data: {
        title: payload.title,
        body: payload.body,
        ...(payload.data ?? {}),
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    const messageId = await admin.messaging().send(message);
    this.logger.log(`Sent FCM topic [${topic}] — messageId: ${messageId}`);
  }

  async subscribeToTopic(token: string, topic: string): Promise<void> {
    await admin.messaging().subscribeToTopic(token, topic);
    this.logger.log(`Subscribed token to topic [${topic}]`);
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    await admin.messaging().unsubscribeFromTopic(token, topic);
    this.logger.log(`Unsubscribed token from topic [${topic}]`);
  }
}
