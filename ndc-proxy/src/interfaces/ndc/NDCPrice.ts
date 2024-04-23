import {Type} from 'class-transformer';

export class NDCPrice {
    @Type(() => Number)
    public Total: number;
    public Code: string;
}
