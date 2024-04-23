import {Exclude} from 'class-transformer';
import {Entity, ObjectID, ObjectIdColumn} from 'typeorm';

@Entity()
export class BaseEntity {
    @ObjectIdColumn()
    @Exclude()
    public id: ObjectID;
}
