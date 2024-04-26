import { Service } from "typedi";
import { SystemVariablesRepository } from "../../database/repositories/SystemVariablesRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import {
  SystemVariable,
  SystemVariableScope,
  SystemVariableType,
} from "../../types/shared/SystemVariables";
import { ESystemVariable } from "../../database/models/ESystemVariable";

@Service()
export class SystemVariablesStorageService {
  @InjectRepository()
  private systemVariablesRepository: SystemVariablesRepository;

  public async findVariable<T extends SystemVariable>(name: T, scope: SystemVariableScope) {
    const result = await this.systemVariablesRepository.findOne({
      name,
      scope,
    });

    return result as ESystemVariable<SystemVariableType<T>>;
  }

  public async upsertVariable<T extends SystemVariable>(
    name: T,
    scope: SystemVariableScope,
    value: SystemVariableType<T>
  ) {
    // insert new variable if not exists variable with same name and scope
    // or update value if already exists
    const result = await this.systemVariablesRepository.mongoUpsert(
      {
        name,
        scope,
        value,
      },
      ["name", "scope"]
    );

    return result as ESystemVariable<SystemVariableType<T>>;
  }

  public async findAllVariables(scope?: SystemVariableScope) {
    const result = await this.systemVariablesRepository.find({
      scope,
    });

    return result;
  }
}
