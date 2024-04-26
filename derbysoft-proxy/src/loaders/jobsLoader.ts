import { MicroframeworkLoader, MicroframeworkSettings } from "microframework-w3tec";
import Container from "typedi";
import { hotelsSyncJob } from "../jobs/hotelsSyncJob";
import { Job, JobRunner } from "../jobs/JobRunner";
import { ghostBookingsJob } from "../jobs/ghostBookingsJob";

export const jobsLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  const jobs: Job[] = [hotelsSyncJob, ghostBookingsJob];

  if (settings) {
    const jobRunner = Container.get(JobRunner);
    jobs.forEach((job) => {
      jobRunner.addJobToQueue(job);
    });

    await jobRunner.runJobsQueue();
  }
};
