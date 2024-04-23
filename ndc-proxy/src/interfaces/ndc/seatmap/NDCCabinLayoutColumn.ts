import {Type} from 'class-transformer';

export class NDCCabinLayoutColumn {
    @Type(() => String)
    public Position: string;

    @Type(() => String)
    public Value: string;
}
