import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OtpCode } from './entities/otp-code.entity';

@Injectable()
export class OtpService {
  private resend: Resend | null = null;
  private mailtrapTransporter: nodemailer.Transporter | null = null;
  private isDev: boolean;

  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private configService: ConfigService,
  ) {
    this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (this.isDev) {
      this.mailtrapTransporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: Number(this.configService.get<string>('MAIL_PORT')),
        secure: false,
        ignoreTLS: true,
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASS'),
        },
      });
    } else {
      this.resend = new Resend(
        this.configService.get<string>('RESEND_API_KEY'),
      );
    }
  }

  async generateOtp(userId: number, email: string): Promise<boolean> {
    const recentOtp = await this.otpRepository.findOne({
      where: { userId, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (recentOtp) {
      const timeSinceLastOtp =
        Date.now() - new Date(recentOtp.createdAt).getTime();
      if (timeSinceLastOtp < 60_000) {
        return false;
      }
    }

    await this.invalidateUserOtps(userId);

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otp = this.otpRepository.create({
      code: codeHash,
      userId,
      expiresAt,
    });
    await this.otpRepository.save(otp);
    await this.sendOtpEmail(email, code);
    return true;
  }

  async verifyOtp(userId: number, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { userId, isUsed: false, expiresAt: MoreThanOrEqual(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!otp) return false;

    const isMatch = await bcrypt.compare(code, otp.code);
    if (isMatch) {
      otp.isUsed = true;
      await this.otpRepository.save(otp);
      return true;
    }

    return false;
  }

  async invalidateUserOtps(userId: number): Promise<void> {
    await this.otpRepository.update(
      { userId, isUsed: false },
      { isUsed: true },
    );
  }

  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  private async sendOtpEmail(email: string, code: string): Promise<void> {
    console.log(`[${this.isDev ? 'DEV' : 'PROD'}] code OTP:`, code);

    const html = this.buildEmailHtml(code);

    if (this.isDev && this.mailtrapTransporter) {
      await this.mailtrapTransporter.sendMail({
        from: '"Lezom" <noreply@lezom.com>',
        to: email,
        subject: 'Ton code de vérification Lezom',
        html,
      });
    } else if (this.resend) {
      const fromEmail =
        this.configService.get<string>('RESEND_FROM_EMAIL') ||
        'onboarding@resend.dev';

      await this.resend.emails.send({
        from: `Lezom <${fromEmail}>`,
        to: email,
        subject: 'Ton code de vérification Lezom',
        html,
      });
    }
  }

  private buildEmailHtml(code: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #313338; border-radius: 8px; color: #fff;">
        <h2 style="margin: 0 0 16px; color: #fff;">Code de vérification</h2>
        <p style="color: #B5BAC1; margin: 0 0 24px;">Utilise ce code pour te connecter à Lezom :</p>
        <div style="background: #1E1F22; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fff;">${code}</span>
        </div>
        <p style="color: #B5BAC1; font-size: 14px; margin: 0;">Ce code expire dans 5 minutes.</p>
      </div>
    `;
  }
}
