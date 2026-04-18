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

  // ─────────────────────────────────────────────────────────────
  // SEND TO TOKENS
  // ─────────────────────────────────────────────────────────────
  async sendToTokens(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
    onExpiredTokens?: (expiredTokens: string[]) => Promise<void>,
  ): Promise<void> {
    const baseUrl = this.config.get<string>('FE_CLIENT_URL');

    if (!tokens.length) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,

      notification: {
        title: payload.title,
        body: payload.body,
      },

      data: {
        ...(payload.data ?? {}),
      },

      android: {
        priority: 'high',
        notification: {
          sound: 'default',
        },
      },

      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: payload.title,
              body: payload.body,
            },
            'mutable-content': 1,
            'content-available': 1,
          },
        },
      },

      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: 'https://img.ztruyen.io.vn/public/favicon/favicon.ico',
          badge: 'https://img.ztruyen.io.vn/public/favicon/favicon.ico',
          requireInteraction: true,
        },

        fcmOptions: {
          link: payload.data?.comicSlug
            ? `${baseUrl}/truyen-tranh/${payload.data.comicSlug}.html`
            : baseUrl,
        },

        data: {
          title: payload.title,
          body: payload.body,
          ...(payload.data ?? {}),
        },
      },
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
        this.logger.error('Cleanup expired tokens failed', err),
      );

      this.logger.log(`Cleaned ${expiredTokens.length} expired FCM token(s)`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEND TO TOPIC
  // ─────────────────────────────────────────────────────────────
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

      notification: {
        title: payload.title,
        body: payload.body,
      },

      data: {
        ...(payload.data ?? {}),
      },

      android: {
        priority: 'high',
        notification: {
          sound: 'default',
        },
      },

      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },

      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: 'https://firebase.google.com/images/social.png',
          badge: 'https://firebase.google.com/images/social.png',
        },

        fcmOptions: {
          link: `https://your-domain.com/truyen-tranh/${payload.data?.comicSlug}.html`,
        },
      },
    };

    const messageId = await admin.messaging().send(message);

    this.logger.log(`Sent topic [${topic}] — messageId: ${messageId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TOPIC SUBSCRIBE
  // ─────────────────────────────────────────────────────────────
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    await admin.messaging().subscribeToTopic(token, topic);
    this.logger.log(`Subscribed token → ${topic}`);
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    await admin.messaging().unsubscribeFromTopic(token, topic);
    this.logger.log(`Unsubscribed token → ${topic}`);
  }
}
