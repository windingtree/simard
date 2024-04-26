import { SessionContext } from "../../types/shared/SessionContext";

export abstract class BaseWTDerbysoftConverter<WTRequest, WTResponse, DerbyRequest, DerbyResponse> {
  public abstract WtToDerbysoftRequest(
    context: SessionContext,
    wtRequest: WTRequest,
    ...args: unknown[]
  ): Promise<DerbyRequest>;
  public abstract DerbysoftToWtResponse(
    context: SessionContext,
    derbySoftRequest: DerbyRequest,
    derbysoftResponse: DerbyResponse,
    ...args: unknown[]
  ): Promise<WTResponse>;
}
