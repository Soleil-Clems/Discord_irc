import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    create(req: any, dto: CreateChannelDto): Promise<import("./entities/channel.entity").Channel>;
    findAll(serverId: number): Promise<import("./entities/channel.entity").Channel[]>;
    findOne(id: number): Promise<import("./entities/channel.entity").Channel>;
    update(req: any, id: number, dto: UpdateChannelDto): Promise<import("./entities/channel.entity").Channel>;
    remove(req: any, id: number): Promise<{
        success: boolean;
    }>;
}
