// import { IsDate } from 'class-validator';
import { IsString } from 'class-validator';
// import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  firstname: string;
  @IsString()
  lastname: string;
  @IsString()
  username: string;
  @IsString()
  email: string;
  @IsString()
  password: string;

  // @Type(() => Date)
  // @IsDate()
  // last_seen: Date;
}
