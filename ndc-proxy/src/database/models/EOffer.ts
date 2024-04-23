import {IsNotEmpty, IsOptional} from 'class-validator';
import {Column, Entity, ObjectID, ObjectIdColumn} from 'typeorm';
import {BaseEntity} from './BaseEntity';
import {ToStringBuilder} from '../../lib/utils/ToStringBuilder';

@Entity( 'offers')
export class EOffer extends BaseEntity {

    @ObjectIdColumn()
    public id: ObjectID;

    @IsOptional()
    @Column({name: 'price'})
    public price: number ;

    @IsOptional()
    @Column({name: 'currency'})
    public currency: string ;

    @IsNotEmpty()
    @Column({name: 'expiration'})
    public expiration: Date;

    @Column({name: 'providerID'})
    @IsNotEmpty()
    public providerID: string;

    @Column({name: 'offerID'})
    @IsNotEmpty()
    public offerID: string;

    @IsNotEmpty()
    @Column({name: 'creationDate'})
    public creationDate: Date;

    public toString(): string {
        return (new ToStringBuilder('EOffer'))
            .addField('offerID', this.offerID)
            .addField('providerID', this.providerID)
            .addField('price', this.price)
            .addField('expiration', this.expiration)
            .build();
    }
}
