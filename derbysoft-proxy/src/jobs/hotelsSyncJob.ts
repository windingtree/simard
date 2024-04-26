import Container from "typedi";
import { Config, ConfigService } from "../services/common/ConfigService";
import { DerbysoftHotelsService } from "../services/derbysoft/DerbysoftHotelsService";
import { Job } from "./JobRunner";

const config = new ConfigService().getConfig("jobs") as Config["jobs"];

const syncHotels = async () => {
  const hotelService = Container.get(DerbysoftHotelsService);
  const hotelsCount = await hotelService.syncHotels();
  return hotelsCount;
};

export const hotelsSyncJob: Job = {
  name: "HotelsSync",
  intervalInHours: config.hotelsSyncIntervalHours,
  description: "Job for recurrently fetching and syncing hotel content and data",
  jobFunction: syncHotels,
};
