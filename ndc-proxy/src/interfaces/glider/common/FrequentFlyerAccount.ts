import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class FrequentFlyerAccount {
    @IsString()
    @IsNotEmpty()
    public airlineCode: string;

    @IsOptional()
    @IsString()
    public programName: string;

    @IsOptional()
    @IsString()
    public accountNumber: string;

    constructor(airlineCode?: string, accountNumber?: string, programName?: string) {
        this.airlineCode = airlineCode;
        this.programName = programName;
        this.accountNumber = accountNumber;
    }
}
