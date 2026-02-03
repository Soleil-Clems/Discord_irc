import { CreatePrivateMessageDto } from './create-private-message.dto';
declare const UpdatePrivateMessageDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePrivateMessageDto>>;
export declare class UpdatePrivateMessageDto extends UpdatePrivateMessageDto_base {
    content: string;
}
export {};
