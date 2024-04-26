import Container from "typedi";
import { Config, ConfigService } from "../services/common/ConfigService";
import { Job } from "./JobRunner";
import { SystemVariablesService } from "../services/system-variables/SystemVariablesService";
import { DateTime } from "luxon";
import { DerbysoftGhostBookingsService } from "../services/derbysoft/DerbysoftGhostBookingsService";

const config = new ConfigService().getConfig("jobs") as Config["jobs"];

const resolveGhostBookings = async () => {
  const systemVariablesService = Container.get(SystemVariablesService);
  const ghostBookingsService = Container.get(DerbysoftGhostBookingsService);

  const currentDateTime = new Date();

  // check last ghost booking job run
  const lastGhostBookingRun = await systemVariablesService.getVariable(
    "LAST_GHOST_BOOKING_RUN",
    "GLOBAL",
    false
  );

  // if time between last run is less than interval skip job run
  if (lastGhostBookingRun?.value) {
    const nextGhostBookingRun = DateTime.fromJSDate(lastGhostBookingRun.value)
      .plus({
        // allow for 10 microsecond delay as Cron does not seem consistent by few milliseconds and
        // causing valid runs to be skipped
        milliseconds: config.ghostBookingResolutionIntervalMinutes * 60 * 1000 - 30,
      })
      .toJSDate();

    if (nextGhostBookingRun > currentDateTime) {
      return null;
    }
  }

  // update last job run to prevent concurrent job runs by multiple instances
  await systemVariablesService.setVariable("LAST_GHOST_BOOKING_RUN", "GLOBAL", currentDateTime);

  // resolve ghost bookings
  await ghostBookingsService.resolveGhostBookingsFromSuppliers();
};

export const ghostBookingsJob: Job = {
  name: "ResolveGhostBookings",
  intervalInHours: config.ghostBookingResolutionIntervalMinutes / 60,
  description: "Job for recurrently resolving ghost bookings",
  jobFunction: resolveGhostBookings,

  // delay job start randomly between 10 seconds to prevent overlapping start times between multiple instances
  delayStartInMs: Math.round(1000 * Math.random() * 10),
};
