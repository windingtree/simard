// // import { defaultMetadataStorage as classTransformerMetadataStorage } from 'class-transformer/storage';
// // import { getFromContainer, MetadataStorage } from 'class-validator';
// import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
// import basicAuth from 'express-basic-auth';
// import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
// import { getMetadataArgsStorage } from 'routing-controllers';
// import { routingControllersToSpec } from 'routing-controllers-openapi';
// import * as swaggerUi from 'swagger-ui-express';
// import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
// import { env } from '../env';
// // import {RoutingControllersOptions} from 'routing-controllers/types/RoutingControllersOptions';
//
// export const swaggerLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {
//     if (settings && env.swagger.enabled) {
//         const expressApp = settings.getData('express_app');
//         // const routingControllersOptions: RoutingControllersOptions = settings.getData('routingControllersOptions');
//
//         /*const { validationMetadatas } = getFromContainer(
//             MetadataStorage
//         ) as any;
//
//         const schemas = validationMetadatasToSchemas(validationMetadatas, {
//             classTransformerMetadataStorage,
//             refPointerPrefix: '#/components/schemas/',
//         });
//
//         const swaggerFile = routingControllersToSpec(
//             getMetadataArgsStorage(),
//             {},
//             {
//                 components: {
//                     schemas,
//                     securitySchemes: {
//                         basicAuth: {
//                             type: 'http',
//                             scheme: 'basic',
//                         },
//                     },
//                 },
//             }
//         );*/
//
//         // Parse class-validator classes into JSON Schema:
//         const schemas = validationMetadatasToSchemas({
//             classTransformerMetadataStorage: defaultMetadataStorage,
//             refPointerPrefix: '#/components/schemas/',
//         });
//
// // Parse routing-controllers classes into OpenAPI spec:
//         const storage = getMetadataArgsStorage();
//         const swaggerFile = routingControllersToSpec(storage, {}, {
//             components: {
//                 schemas,
//                 securitySchemes: {
//                     basicAuth: {
//                         scheme: 'basic',
//                         type: 'http',
//                     },
//                 },
//             },
//             info: {
//                 description: 'Generated with `routing-controllers-openapi`',
//                 title: 'A sample API',
//                 version: '1.0.0',
//             },
//         });
//
//         // Add npm infos to the swagger doc
//         swaggerFile.info = {
//             title: env.app.name,
//             description: env.app.description,
//             version: env.app.version,
//         };
//
//         swaggerFile.servers = [
//             {
//                 url: `${env.app.schema}://${env.app.host}:${env.app.port}${env.app.routePrefix}`,
//             },
//         ];
//
//         // await writeFileSync('../../schema.json', JSON.stringify(swaggerFile, undefined, 2));
//
//         expressApp.use(
//             env.swagger.route,
//             env.swagger.username ? basicAuth({
//                 users: {
//                     [`${env.swagger.username}`]: env.swagger.password,
//                 },
//                 challenge: true,
//             }) : (req, res, next) => next(),
//             swaggerUi.serve,
//             swaggerUi.setup(swaggerFile)
//         );
//
//     }
// };
