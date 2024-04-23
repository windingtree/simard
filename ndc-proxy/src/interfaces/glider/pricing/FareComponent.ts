import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class FareComponent {
    @IsNotEmpty()
    @IsString()
    public name: string;

    @IsOptional()
    @IsString()
    public basisCode: string;   // fare basis code

    @IsOptional()
    @IsString()
    public designator: string;  // booking class

    @IsOptional()
    @IsString()
    public conditions: string;

    constructor(name?: string, basisCode?: string, designator?: string, conditions?: string) {
        this.name = name;
        this.basisCode = basisCode;
        this.designator = designator;
        this.conditions = conditions;
    }
}
