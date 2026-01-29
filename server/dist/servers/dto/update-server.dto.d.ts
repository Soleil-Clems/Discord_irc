import { CreateServerDto } from './create-server.dto';
declare const UpdateServerDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateServerDto>>;
export declare class UpdateServerDto extends UpdateServerDto_base {
    name: string;
}
export {};
