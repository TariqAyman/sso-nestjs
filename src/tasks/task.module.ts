import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TaskService } from "./task.service";
import { WebhookModule } from "../webhook/webhook.module";

@Module({
  imports: [ScheduleModule.forRoot(), WebhookModule],
  providers: [TaskService],
})
export class TaskModule {}
