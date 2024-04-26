import Container, { Service } from "typedi";
import { SystemVariablesStorageService } from "./SystemVariablesStorageService";
import {
  SystemVariable,
  SystemVariableScope,
  SystemVariableType,
} from "../../types/shared/SystemVariables";

@Service()
export class SystemVariablesService {
  private get systemVariablesStorageService(): SystemVariablesStorageService {
    return Container.get(SystemVariablesStorageService);
  }

  public async getVariable(
    name: SystemVariable,
    scope: SystemVariableScope,
    throwIfNotFound = false
  ) {
    const variable = await this.systemVariablesStorageService.findVariable(name, scope);
    if (!variable && throwIfNotFound) {
      throw new Error(`System variable '${name}' in '${scope}' not found`);
    }

    return variable;
  }

  public async setVariable<T extends SystemVariable>(
    name: T,
    scope: SystemVariableScope,
    value: SystemVariableType<T>
  ) {
    return this.systemVariablesStorageService.upsertVariable(name, scope, value);
  }
}
