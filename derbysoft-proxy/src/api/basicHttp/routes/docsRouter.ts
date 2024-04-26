import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "js-yaml";
import { readFileSync } from "fs";
import { Converter } from "showdown";
import { join } from "path";

const docsDirectory = join(__dirname, "../../../docs");

// const pathToSwaggerYaml = "node_modules/@windingtree/glider-types/dist/accommodations.yaml";
const pathToSwaggerYaml = join(docsDirectory, "accommodations.yaml");
const swaggerYaml = YAML.load(readFileSync(pathToSwaggerYaml));

// convert how-to MD file to html
const howToMd = readFileSync(join(docsDirectory, "HOW-TO.md"), { encoding: "utf-8" });
const converter = new Converter({
  completeHTMLDocument: true,
  openLinksInNewWindow: true,
});
const howToHtml = converter.makeHtml(howToMd);

// init router
const docsRouter = Router();
docsRouter.use(swaggerUi.serve);

// serve base doc
docsRouter.get("/", (req, res, next) => {
  try {
    res.send(howToHtml);
  } catch (error) {
    return next(error);
  }
});

// serve YAML file
docsRouter.get("/yaml", (req, res, next) => {
  try {
    res.download(pathToSwaggerYaml);
  } catch (error) {
    return next(error);
  }
});

// server docs as swagger UI
docsRouter.get("/swagger", swaggerUi.setup(swaggerYaml));

export { docsRouter };
