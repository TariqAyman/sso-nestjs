# Task Scheduling & Background Processing

This document covers the background task processing and scheduling system implemented in the NestJS Open SSO project.

## Overview

The application uses `@nestjs/schedule` for cron-based task scheduling and background processing. This system handles webhook retries, data cleanup, and other recurring maintenance tasks.

## Architecture

### Components

- **TaskService**: Main service handling scheduled tasks
- **TaskModule**: Module configuration for task scheduling
- **WebhookService**: Integrated service for webhook retry logic

### Dependencies

```typescript
// Core Dependencies
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

// Custom Services
import { WebhookService } from "../webhook/webhook.service";
```

## Current Implementation

### Task Service Structure

```typescript
@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly webhookService: WebhookService) {}

  // Scheduled tasks defined with decorators
}
```

### Module Configuration

```typescript
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TaskService } from "./task.service";
import { WebhookModule } from "../webhook/webhook.module";

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable task scheduling
    WebhookModule, // For webhook retry functionality
  ],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
```

## Scheduled Tasks

### 1. Webhook Retry Task

**Schedule**: Every 5 minutes
**Purpose**: Retry failed webhook deliveries

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async handleWebhookRetries() {
  this.logger.debug("Starting webhook retry task...");

  try {
    await this.webhookService.retryFailedWebhooks();
    this.logger.debug("Webhook retry task completed successfully");
  } catch (error) {
    this.logger.error("Webhook retry task failed:", error);
  }
}
```

**Functionality**:

- Finds webhooks with failed status
- Implements exponential backoff retry logic
- Updates webhook status after retry attempts
- Logs all retry activities

### 2. Webhook Log Cleanup Task

**Schedule**: Daily at midnight
**Purpose**: Clean up old webhook logs to maintain database performance

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async cleanupOldWebhookLogs() {
  this.logger.debug("Starting webhook log cleanup task...");

  try {
    // Implementation for cleaning up old webhook logs
    // Currently placeholder - to be implemented based on retention policy
    this.logger.debug("Webhook log cleanup task completed");
  } catch (error) {
    this.logger.error("Webhook log cleanup task failed:", error);
  }
}
```

## Available Cron Expressions

The `@nestjs/schedule` package provides convenient cron expression constants:

### Time-Based

- `CronExpression.EVERY_SECOND` - `* * * * * *`
- `CronExpression.EVERY_5_SECONDS` - `*/5 * * * * *`
- `CronExpression.EVERY_10_SECONDS` - `*/10 * * * * *`
- `CronExpression.EVERY_30_SECONDS` - `*/30 * * * * *`

### Minute-Based

- `CronExpression.EVERY_MINUTE` - `0 * * * * *`
- `CronExpression.EVERY_5_MINUTES` - `0 */5 * * * *`
- `CronExpression.EVERY_10_MINUTES` - `0 */10 * * * *`
- `CronExpression.EVERY_30_MINUTES` - `0 */30 * * * *`

### Hour-Based

- `CronExpression.EVERY_HOUR` - `0 0 * * * *`
- `CronExpression.EVERY_2_HOURS` - `0 0 */2 * * *`
- `CronExpression.EVERY_3_HOURS` - `0 0 */3 * * *`
- `CronExpression.EVERY_6_HOURS` - `0 0 */6 * * *`
- `CronExpression.EVERY_12_HOURS` - `0 0 */12 * * *`

### Daily

- `CronExpression.EVERY_DAY_AT_1AM` - `0 0 1 * * *`
- `CronExpression.EVERY_DAY_AT_2AM` - `0 0 2 * * *`
- `CronExpression.EVERY_DAY_AT_MIDNIGHT` - `0 0 0 * * *`

### Weekly & Monthly

- `CronExpression.EVERY_WEEK` - `0 0 0 * * 0`
- `CronExpression.EVERY_WEEKEND` - `0 0 0 * * 6`
- `CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT` - `0 0 0 1 * *`
- `CronExpression.EVERY_2ND_HOUR` - `0 0 */2 * * *`

## Adding New Scheduled Tasks

### Step 1: Create Task Method

```typescript
@Cron(CronExpression.EVERY_HOUR) // Choose appropriate schedule
async yourNewTask() {
  this.logger.debug("Starting your new task...");

  try {
    // Your task logic here
    await this.performTaskLogic();
    this.logger.debug("Your new task completed successfully");
  } catch (error) {
    this.logger.error("Your new task failed:", error);
  }
}
```

### Step 2: Implement Task Logic

```typescript
private async performTaskLogic() {
  // Example: Database cleanup
  // Example: Email sending
  // Example: External API synchronization
  // Example: File processing
}
```

### Step 3: Add Dependencies

If your task requires additional services:

```typescript
constructor(
  private readonly webhookService: WebhookService,
  private readonly emailService: EmailService, // New service
  private readonly userService: UserService,   // New service
) {}
```

## Webhook Retry Logic

### Implementation Details

The webhook retry system implements the following strategy:

1. **Failure Detection**: Webhooks that fail initial delivery are marked for retry
2. **Exponential Backoff**: Retry intervals increase exponentially (1m, 5m, 15m, 1h, 6h)
3. **Maximum Attempts**: Configurable maximum retry attempts before marking as permanently failed
4. **Status Tracking**: Complete audit trail of all delivery attempts

### Retry Schedule

| Attempt | Delay      | Total Time |
| ------- | ---------- | ---------- |
| 1       | 1 minute   | 1m         |
| 2       | 5 minutes  | 6m         |
| 3       | 15 minutes | 21m        |
| 4       | 1 hour     | 1h 21m     |
| 5       | 6 hours    | 7h 21m     |

## Task Monitoring & Logging

### Logging Levels

- **Debug**: Task start/completion messages
- **Error**: Task failures and exceptions
- **Info**: Important state changes

### Log Format

```
[TaskService] Starting webhook retry task...
[TaskService] Webhook retry task completed successfully
[TaskService] Webhook retry task failed: Error message
```

### Monitoring Recommendations

1. **Application Logs**: Monitor task execution logs
2. **Database Metrics**: Track webhook log table growth
3. **Performance Metrics**: Monitor task execution duration
4. **Error Rates**: Alert on high task failure rates

## Configuration Options

### Environment Variables

```bash
# Task scheduling configuration
ENABLE_TASK_SCHEDULING=true
WEBHOOK_RETRY_INTERVAL_MINUTES=5
WEBHOOK_CLEANUP_RETENTION_DAYS=30
LOG_LEVEL=debug
```

### Dynamic Configuration

Tasks can be enabled/disabled based on environment:

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async handleWebhookRetries() {
  if (!process.env.ENABLE_WEBHOOK_RETRIES) {
    return;
  }

  // Task logic...
}
```

## Production Considerations

### 1. Scaling

- **Single Instance**: Tasks run on one application instance
- **Clustering**: Use distributed locking for multi-instance deployments
- **Queue Systems**: Consider Redis/Bull for complex task management

### 2. Error Handling

- **Graceful Degradation**: Continue operation even if individual tasks fail
- **Dead Letter Queues**: Store permanently failed tasks for manual review
- **Alerting**: Set up monitoring for critical task failures

### 3. Performance

- **Batch Processing**: Process multiple items in single task execution
- **Database Optimization**: Use efficient queries for large datasets
- **Memory Management**: Avoid memory leaks in long-running tasks

## Troubleshooting

### Common Issues

1. **Task Not Running**
   - Check if ScheduleModule is imported
   - Verify cron expression syntax
   - Check application logs for errors

2. **Database Deadlocks**
   - Implement proper transaction handling
   - Add retry logic for database operations
   - Use appropriate isolation levels

3. **Memory Issues**
   - Monitor memory usage during task execution
   - Implement pagination for large datasets
   - Clean up resources properly

### Debugging

```typescript
// Enable debug logging
@Cron(CronExpression.EVERY_MINUTE)
async debugTask() {
  const startTime = Date.now();
  this.logger.debug(`Task started at ${new Date()}`);

  try {
    // Task logic
    const duration = Date.now() - startTime;
    this.logger.debug(`Task completed in ${duration}ms`);
  } catch (error) {
    this.logger.error(`Task failed after ${Date.now() - startTime}ms`, error);
  }
}
```

## Future Enhancements

### Planned Features

1. **Task Dashboard**: Web interface for monitoring task execution
2. **Dynamic Scheduling**: Runtime task scheduling via API
3. **Distributed Tasks**: Multi-instance task coordination
4. **Task Dependencies**: Sequential task execution
5. **Custom Retry Strategies**: Configurable retry policies per task type

### Integration Opportunities

1. **Queue Integration**: Redis Bull for advanced task management
2. **Metrics Collection**: Prometheus metrics for task monitoring
3. **Notification System**: Slack/email alerts for task failures
4. **Health Checks**: Task-based application health monitoring

## Best Practices

1. **Idempotency**: Design tasks to be safely re-runnable
2. **Error Handling**: Always wrap task logic in try-catch blocks
3. **Logging**: Provide detailed logging for debugging
4. **Performance**: Monitor and optimize task execution time
5. **Testing**: Write unit tests for task logic
6. **Documentation**: Document task purpose and behavior

## API Integration

While tasks run automatically, you can also trigger them manually via API endpoints:

```typescript
// Example: Manual webhook retry endpoint
@Post('webhooks/retry-all')
async retryAllWebhooks() {
  await this.taskService.handleWebhookRetries();
  return { message: 'Webhook retry task triggered' };
}
```

This task scheduling system provides a robust foundation for background processing in the Open SSO application, ensuring reliable webhook delivery and efficient system maintenance.
