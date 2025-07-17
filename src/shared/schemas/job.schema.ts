import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { Document } from "mongoose";

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, unique: true })
  job_id: string;

  @Prop({ required: true })
  org_id: string;

  @Prop({ required: true, index: true })
  app_version_id: string;

  @Prop({ required: true })
  test_path: string;

  @Prop({ required: true })
  target: string; // emulator, device, browserstack

  @Prop({
    required: true,
    enum: ["pending", "queued", "running", "completed", "failed", "cancelled"],
    default: "pending",
  })
  status: string;

  @Prop({ type: Number, default: 5, min: 1, max: 10 })
  priority: number;

  @Prop({ type: [String], default: [] })
  logs: string[];

  @Prop({ type: Number, default: 0 })
  retry_count: number;

  @Prop({ type: Number, default: 3 })
  max_retries: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Indexes for performance
JobSchema.index({ app_version_id: 1, status: 1 });
JobSchema.index({ status: 1, priority: -1, createdAt: 1 });
JobSchema.index({ target_environment: 1, status: 1 });
