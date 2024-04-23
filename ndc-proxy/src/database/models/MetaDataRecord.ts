import {IsNotEmpty, IsOptional, IsUUID} from 'class-validator';
import {Column, Entity, ObjectID, ObjectIdColumn} from 'typeorm';
import {BaseEntity} from './BaseEntity';
import {ToStringBuilder} from '../../lib/utils/ToStringBuilder';

@Entity( 'metadata')
export class MetaDataRecord extends BaseEntity {

    @ObjectIdColumn()
    public id: ObjectID;

    // TODO create index
    @IsNotEmpty()
    @Column({name: 'providerId'})       // this should be populated with carrier/hotel provider ID (e.g. AA, UA, RevMax, etc...)
    public providerId: string;

    @IsOptional()
    @Column({name: 'identifiers'})      // usually metadata (e.g. shopping results) are related to other records (e.g. offer, order) - this field should contain offerID, orderID so that metadata can be searched based on offer/orderID
    public identifiers: string[] ;

    @IsNotEmpty()
    @Column({name: 'dataType'})         // e.g. 'pricing', 'order', 'offer'...
    public dataType: string;

    @IsNotEmpty()
    @Column({name: 'contextId'})
    @IsUUID()
    public contextId: string;

    @IsOptional()
    @Column({name: 'customData'})
    public customData: any ;

    @IsNotEmpty()
    @Column({name: 'creationDate'})
    public creationDate: Date;

    public toString(): string {
        return (new ToStringBuilder('MetaDataRecord'))
            .addField('providerId', this.providerId)
            .addField('dataType', this.dataType)
            .addField('identifiers', this.identifiers)
            .build();
    }
}
