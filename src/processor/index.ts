import type { Job } from "bullmq";
import type { SchedulerJobData } from "@wei/probot-scheduler";
import type { Probot } from "probot";
import logger from "@/src/utils/logger.ts";
import { getPullConfig } from "@/src/utils/get-pull-config.ts";
import { Pull } from "@/src/processor/pull.ts";

export function getRepoProcessor(probot: Probot) {
  return async function RepoJobProcessor(job: Job<SchedulerJobData>) {
    const log = logger.child({
      jobId: job.id,
      jobData: job.data,
    });

    log.info("🏃 Processing repo job");

    const { installation_id, owner, repo } = job.data;

    try {
      const octokit = await probot.auth(installation_id);

      const config = await getPullConfig(octokit, log, job.data);
      if (!config) {
        log.info(`⚠️ No config found, skipping`);
        return;
      }

      const pull = new Pull(octokit, { owner, repo, logger: log }, config);
      await pull.routineCheck();

      log.info(`✅ Repo job ${job.id} processed successfully`);
    } catch (error) {
      log.error(error, "❌ Repo job failed");
    }
  };
}
