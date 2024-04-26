import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import { Connection, EntityTarget, createConnection, getConnectionOptions } from "typeorm";
import { EHotel } from "../database/models/EHotel";
import { EDerbysoftHotel } from "../database/models/EDerbysoftHotel";
import { Config, ConfigService } from "../services/common/ConfigService";
import { useContainer as ormUseContainer } from "typeorm";
import { Container } from "typeorm-typedi-extensions";
import { EOffer, MetaDataRecord } from "@simardwt/winding-tree-utils";
import { readFileSync } from "fs";
import { EOrder } from "../database/models/EOrder";
import { ESystemVariable } from "../database/models/ESystemVariable";
import { EGhostBooking } from "../database/models/EGhostBooking";

export const typeormLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  const env = new ConfigService().getConfig() as Config;
  const loadedConnectionOptions = await getConnectionOptions();

  const connectionOptions = Object.assign(loadedConnectionOptions, {
    type: env.db.type, // See createConnection options for valid types
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
    database: env.db.database,
    synchronize: env.db.synchronize,
    logging: env.db.logging,
    // entities: env.app.dirs.entities,
    entities: [
      MetaDataRecord,
      EHotel,
      EDerbysoftHotel,
      EOffer,
      EOrder,
      ESystemVariable,
      EGhostBooking,
    ],
    ssl: env.db.useSSL, // `true` or `false`,
    sslCA: env.db.sslCA && env.db.useSSL ? [readFileSync(env.db.sslCA)] : undefined,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: env.db.retryWrites,
  });

  // console.log("Connection options:", connectionOptions);
  ormUseContainer(Container);
  const connection = await createConnection(connectionOptions);

  // create ttl index for metadataRecords
  // get metadata TTL from env
  const { metadataTTL } = env.db;
  const indexName = "createdAt_TTL";

  await createTTLIndex(connection, MetaDataRecord, metadataTTL, indexName);

  // add/update 2dsphere index to hotel entity's "location" field
  await connection.getMongoRepository(EHotel).createCollectionIndex({ location: "2dsphere" });

  if (settings) {
    settings.setData("connection", connection);
    settings.onShutdown(() => connection.close());
  }
};

export const createTTLIndex = async <Entity>(
  connection: Connection,
  targetEntity: EntityTarget<Entity>,
  ttl: number,
  indexName = "createdAt_TTL"
) => {
  // TO-DO: hacky way to know if a collection exists with possible indexes
  let collectionExists = false;
  try {
    const stats = await connection.getMongoRepository(targetEntity).stats();
    collectionExists = stats.nindexes > 0;
  } catch (error) {
    // do nothing
  }

  let indexExists = false;
  if (collectionExists) {
    indexExists = await connection
      .getMongoRepository(targetEntity)
      .collectionIndexExists(indexName);
  }

  if (indexExists) {
    // check if TTL is different
    // retrieve index
    const indexes = await connection.getMongoRepository(targetEntity).collectionIndexes();

    const index = (indexes as { name: string; expireAfterSeconds: number }[]).find(
      (idx) => idx.name === indexName
    );

    if (index?.expireAfterSeconds !== ttl) {
      // this might be a performance nightmare!
      // TO-DO: how to use runCommand to run commands directly in mongoDB
      // drop old index and create new one
      await connection.getMongoRepository(targetEntity).dropCollectionIndex(indexName);

      connection
        .getMongoRepository(targetEntity)
        .createCollectionIndex({ createdAt: 1 }, { name: indexName, expireAfterSeconds: ttl });
    }
  } else {
    connection
      .getMongoRepository(targetEntity)
      .createCollectionIndex({ createdAt: 1 }, { name: indexName, expireAfterSeconds: ttl });
  }
};
