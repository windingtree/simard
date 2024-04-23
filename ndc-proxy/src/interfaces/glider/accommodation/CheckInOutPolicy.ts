import {IsNotEmpty, IsString} from 'class-validator';

export class CheckInOutPolicy {

    @IsString()
    @IsNotEmpty()
    public checkOutTime: string;

    @IsNotEmpty()
    @IsString()
    public checkinTime: string;
}
