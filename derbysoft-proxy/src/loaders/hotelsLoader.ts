import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import Container from "typedi";
import { CronJob } from "cron";
import { DerbysoftHotelsService } from "../services/derbysoft/DerbysoftHotelsService";

export const hotelsLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  const syncHotels = async () => {
    const hotelService = Container.get(DerbysoftHotelsService);
    const hotelsCount = await hotelService.syncHotels();
    return hotelsCount;
  };

  if (settings) {
    // sync hotels on startup then initiate jobs
    await syncHotels();

    // run cron job everyday at 12am
    const job = new CronJob("0 0 0 */1 * *", syncHotels);
    job.start();
  }
};
