import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DmsModule } from './dms/dms.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'lezom_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ServersModule,
    ChannelsModule,
    MessagesModule,
    ConversationsModule,
    DmsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
    }),
  ],
})
export class AppModule {}
