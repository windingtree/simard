import { useContainer as classValidatorUseContainer } from "class-validator";
import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import { Container } from "typeorm-typedi-extensions";

export const iocLoader: MicroframeworkLoader = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: MicroframeworkSettings | undefined
) => {
  classValidatorUseContainer(Container);
};
