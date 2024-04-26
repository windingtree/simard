import { Column, Entity, Index } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { BaseEntity } from "./BaseEntity";
import { SystemVariable, SystemVariableScope } from "../../types/shared/SystemVariables";

@Entity("systemVariables")
export class ESystemVariable<T = unknown> extends BaseEntity {
  @Column({ name: "name" })
  @Index({ unique: true })
  @IsNotEmpty()
  public name: SystemVariable;

  @Column({ name: "value" })
  @IsNotEmpty()
  public value: T;

  @Column({ name: "scope", default: "GLOBAL" })
  @IsNotEmpty()
  public scope: SystemVariableScope = "GLOBAL";

  constructor(params: Partial<ESystemVariable<T>>) {
    super();
    Object.assign(this, params);
  }
}
