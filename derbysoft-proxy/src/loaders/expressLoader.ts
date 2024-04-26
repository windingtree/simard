import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import { runHttpServer } from "../api";

export const expressLoader: MicroframeworkLoader = (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    // const connection = settings.getData('connection');

    /**
     * We create a new express server instance.
     * We could have also use useExpressServer here to attach controllers to an existing express instance.
     */

    const expressServer = runHttpServer();
    settings.setData("express_server", expressServer);
  }
};
