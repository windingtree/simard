import {IsNotEmpty, IsOptional, IsUUID} from 'class-validator';
import {Column, Entity, ObjectID, ObjectIdColumn} from 'typeorm';
import {BaseEntity} from './BaseEntity';
import {ToStringBuilder} from '../../lib/utils/ToStringBuilder';

@Entity( 'offerMetadata')
export class OfferMetadata extends BaseEntity {

    @ObjectIdColumn()
    public id: ObjectID;

    // TODO create index
    @IsNotEmpty()
    @Column({name: 'providerId'})
    public providerId: string;

    @IsNotEmpty()
    @Column({name: 'offerId'})
    public offerId: string;

    @IsOptional()
    @Column({name: 'contextId'})
    @IsUUID()
    public contextId: string;

    public toString(): string {
        return (new ToStringBuilder('offerMetadata'))
            .addField('providerId', this.providerId)
            .addField('offerId', this.offerId)
            .addField('contextId', this.contextId)
            .build();
    }

}
