import { Entity, ObjectID, ObjectIdColumn, BaseEntity as TypeORMBaseEntity } from "typeorm";
import { Exclude, instanceToPlain } from "class-transformer";

@Entity()
export abstract class BaseEntity extends TypeORMBaseEntity {
  @ObjectIdColumn()
  @Exclude()
  public id: ObjectID;

  public toJSON() {
    return instanceToPlain(this);
  }
}
