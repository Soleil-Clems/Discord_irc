import { Module } from '@nestjs/common';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [DmsService],
  controllers: [DmsController],
  exports: [DmsService],
})
export class DmsModule {}
