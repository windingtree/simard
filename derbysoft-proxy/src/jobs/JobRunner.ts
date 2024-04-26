import { Service } from "typedi";
import { CronJob } from "cron";
import { CronTime } from "cron-time-generator";
import { getLogger } from "@simardwt/winding-tree-utils";
import { waitFor } from "../utils/generalUtils";

export interface Job {
  name: string;
  description?: string;
  intervalInHours: number;
  jobFunction: () => Promise<unknown>;
  status?: "active" | "inactive";
  delayStartInMs?: number;
}

export type JobStatus = {
  name: string;
  status: "active" | "inactive";
};

type QueueItem = {
  job: Job;
  cronJob: CronJob;
};

@Service()
export class JobRunner {
  private jobQueue: QueueItem[] = [];
  private log = getLogger(__filename);

  private getJobByIndex(index: number): QueueItem {
    return this.jobQueue[index];
  }

  private getJobByName(name: string): QueueItem {
    return this.jobQueue.find(({ job }) => job.name === name);
  }

  private getJob(nameOrIndex: string | number): QueueItem {
    let job: QueueItem;
    if (typeof nameOrIndex === "string") {
      // get job by name
      job = this.getJobByName(nameOrIndex);
    } else if (typeof nameOrIndex === "number") {
      // get job by index
      job = this.getJobByIndex(nameOrIndex);
    }

    if (!job) {
      throw new Error(`Job with name or index ${nameOrIndex} not found`);
    }

    return job;
  }

  private async startQueueItem({ cronJob, job }: QueueItem) {
    this.log.info(`Job "${job.name}" starting ...`);

    if (job.delayStartInMs) {
      this.log.info(`Delaying Job "${job.name}" start by ${job.delayStartInMs} milliseconds`);
      await waitFor(job.delayStartInMs);
    }

    // run job function first time before starting job
    await job.jobFunction();

    cronJob.start();
    job.status = "active";
    this.log.info(`Job "${job.name}" started - (interval - ${job.intervalInHours}hrs) `);
  }

  private stopQueueItem({ cronJob, job }: QueueItem) {
    cronJob.stop();
    job.status = "inactive";
    this.log.info(`Job "${job.name} stopped"`);
  }

  public addJobToQueue(job: Job, startJob = false) {
    if (!job) {
      throw new Error("addJobToQueue: Job is undefined");
    }

    // ensure job name is unique
    const jobNameExists = this.getJobByName(job.name);
    if (jobNameExists) {
      throw new Error(`addJobToQueue: Job with name ${job.name} already exists`);
    }

    // create cron interval
    const { intervalInHours, jobFunction } = job;

    let cronInterval: string;

    if (intervalInHours >= 1) {
      cronInterval = CronTime.every(intervalInHours).hours();
    } else {
      // convert to minutes
      const minutes = intervalInHours * 60;
      cronInterval = CronTime.every(minutes).minutes();
    }

    const cronJob = new CronJob(cronInterval, jobFunction);

    if (startJob) {
      this.startQueueItem({ job, cronJob });
    }

    this.jobQueue.push({
      cronJob,
      job,
    });
  }

  public getJobs(): JobStatus[] {
    return this.jobQueue.map(({ job }) => ({
      name: job.name,
      status: job.status,
    }));
  }

  public startJob(nameOrIndex: string | number) {
    const { job, cronJob } = this.getJob(nameOrIndex);
    this.startQueueItem({ job, cronJob });
  }

  public stopJob(nameOrIndex: string | number) {
    const { job, cronJob } = this.getJob(nameOrIndex);
    this.stopQueueItem({ job, cronJob });
  }

  public async runJobsQueue() {
    this.log.info("Starting jobs queue ...");
    const jobsPromise = this.jobQueue.map(({ job, cronJob }) => {
      return this.startQueueItem({ job, cronJob });
    });

    await Promise.all(jobsPromise);

    this.log.info("Jobs queue started");
  }

  public stopJobsQueue() {
    this.log.info("Stopping jobs queue ...");
    this.jobQueue.forEach(({ job, cronJob }) => {
      this.stopQueueItem({ job, cronJob });
    });

    this.log.info("Jobs queue stopped");
  }
}
