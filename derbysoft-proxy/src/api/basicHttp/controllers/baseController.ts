import { getLogger } from "@simardwt/winding-tree-utils";

export class BaseController {
  protected log = getLogger(__filename, {
    topic: "derbysoft-proxy-http",
  });
}
