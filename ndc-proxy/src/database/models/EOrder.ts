import {IsEnum, IsNotEmpty, IsString} from 'class-validator';
import {Column, Entity, ObjectID, ObjectIdColumn} from 'typeorm';
import {BaseEntity} from './BaseEntity';
import {ToStringBuilder} from '../../lib/utils/ToStringBuilder';
import {OrderProcessingStage, Order} from '../../interfaces/glider/order';
import {GuaranteeType} from '../../services/bre/GuaranteeType';
import {Exclude, Type} from 'class-transformer';
import { OrderProviderDetails } from '../../interfaces/glider/order/OrderProviderDetails';

export interface EOrderConstructorParameters {
     orderID: string;
     offerID: string;
     creationDate: Date;
     processingStage: OrderProcessingStage;
     guaranteeID: string;
}

@Entity( 'orders')
export class EOrder extends BaseEntity {

    @ObjectIdColumn()
    public id: ObjectID;

    @IsNotEmpty()
    @Column({name: 'creationDate'})
    public creationDate: Date;

    @Column({name: 'providerID'})
    public providerID: string;

    @Column({name: 'orderID'})
    @IsNotEmpty()
    public orderID: string;

    @Column({name: 'offerID'})
    @IsNotEmpty()
    public offerID: string;

    @Column({name: 'processingStage'})
    @IsNotEmpty()
    @IsEnum(OrderProcessingStage)
    public processingStage: OrderProcessingStage;

    @Column({name: 'guaranteeType'})
    @IsEnum(GuaranteeType)
    public guaranteeType: GuaranteeType;

    @Column({name: 'guaranteeID'})
    @IsNotEmpty()
    @IsString()
    public guaranteeID: string;

    @Column({name: 'orgID'})
    @IsString()
    public orgID: string;

    @Column({name: 'confirmation'})
    @Type(() => Order)
    public confirmation: Order;

    @Column({name: 'providerDetails'})
    @Type(() => OrderProviderDetails)
    @Exclude()
    public providerDetails: OrderProviderDetails;

    @Column({name: 'tokenDetails'})
    @Exclude()
    public tokenDetails: any;

    constructor(parameters?: EOrderConstructorParameters) {
        super();
        if (parameters) {
            const {creationDate, orderID, processingStage, guaranteeID, offerID}  = parameters;
            this.creationDate = creationDate;
            this.orderID = orderID;
            this.offerID = offerID;
            this.processingStage = processingStage;
            this.guaranteeID = guaranteeID;
        }
    }

    public toString(): string {
        return (new ToStringBuilder('EOrder'))
            .addField('id', this.id)
            .addField('orderID', this.orderID)
            .addField('offerID', this.offerID)
            .addField('providerID', this.providerID)
            .addField('processingStage', this.processingStage)
            .addField('creationDate', this.creationDate)
            .build();
    }
}
