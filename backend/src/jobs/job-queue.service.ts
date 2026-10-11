import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue, Worker, type Job } from "bullmq";
import IORedis, { type Redis } from "ioredis";
import { AppConfigService } from "../config/app-config.service";

type JobHandler<T> = (payload: T) => Promise<void>;

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly redisEnabled: boolean;
  private readonly connection: Redis | null;
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly inProcessHandlers = new Map<string, JobHandler<unknown>>();

  constructor(private readonly appConfig: AppConfigService) {
    this.redisEnabled = this.appConfig.get("REDIS_ENABLED");
    const redisUrl = this.appConfig.get("REDIS_URL");
    this.connection = this.redisEnabled && redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : null;
  }

  register<T>(queueName: string, handler: JobHandler<T>): void {
    if (this.redisEnabled && this.connection) {
      const worker = new Worker<T>(
        queueName,
        async (job: Job<T>) => {
          await handler(job.data);
        },
        { connection: this.connection },
      );
      worker.on("failed", (job, error) => this.logger.error(`Job ${queueName}#${job?.id} failed: ${error.message}`));
      this.workers.set(queueName, worker);
    } else {
      this.inProcessHandlers.set(queueName, handler as JobHandler<unknown>);
    }
  }

  async enqueue<T>(queueName: string, payload: T): Promise<void> {
    if (this.redisEnabled && this.connection) {
      const queue = this.getOrCreateQueue(queueName);
      await queue.add(queueName, payload);
      return;
    }

    const handler = this.inProcessHandlers.get(queueName);
    if (!handler) {
      this.logger.warn(`No in-process handler registered for job "${queueName}"`);
      return;
    }
    await handler(payload);
  }

  private getOrCreateQueue(queueName: string): Queue {
    const existing = this.queues.get(queueName);
    if (existing) return existing;
    if (!this.connection) throw new Error("Redis connection is not configured");
    const queue = new Queue(queueName, { connection: this.connection });
    this.queues.set(queueName, queue);
    return queue;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(Array.from(this.workers.values()).map((worker) => worker.close()));
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    await this.connection?.quit();
  }
}
