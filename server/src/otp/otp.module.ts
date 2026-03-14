import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OtpCode } from './entities/otp-code.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode]), ConfigModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
