// ** NestJs
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Resend
import { Resend } from 'resend';

// ** Pug
import pug from 'pug';

// ** Path
import { join } from 'path';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('RESEND_API_KEY'),
    );
  }

  private renderTemplate(templateName: string, context: any) {
    const templatePath = join(
      process.cwd(),
      'src/email/templates',
      `${templateName}.pug`,
    );
    return pug.renderFile(templatePath, context);
  }

  async sendResetPasswordEmail(
    to: string,
    username: string,
    resetLink: string,
    expireTime: string,
  ) {
    const html = this.renderTemplate('reset-password', {
      name: username,
      resetLink,
      expireTime,
    });

    await this.resend.emails.send({
      to,
      from: this.configService.get<string>('RESEND_FROM_EMAIL'),
      subject: '🔐 Yêu cầu đặt lại mật khẩu - ZTruyen',
      html,
    });
  }
}
