import {IsNotEmpty, IsString} from 'class-validator';

export class Equipment {
  @IsNotEmpty()
  @IsString()
  public aircraftCode: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

}
