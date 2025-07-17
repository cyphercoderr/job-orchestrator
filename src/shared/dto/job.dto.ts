import { IsString, IsOptional, IsNumber, Min, Max } from "class-validator";
import { Expose } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitJobDto {
  @Expose()
  @ApiProperty({ description: "Organization identifier" })
  @IsString()
  org_id: string;

  @Expose()
  @ApiProperty({ description: "App version ID" })
  @IsString()
  app_version_id: string;

  @Expose()
  @ApiProperty({ description: "Path to the test file" })
  @IsString()
  test_path: string;

  @Expose()
  @ApiProperty({
    description: "Target environment (emulator, device, browserstack)",
  })
  @IsString()
  target: string;

  @Expose()
  @ApiPropertyOptional({ description: "Job priority", minimum: 1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number = 5;
}

export class JobStatusDto {
  @Expose()
  @ApiProperty()
  job_id: string;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  org_id: string;

  @Expose()
  @ApiProperty()
  app_version_id: string;

  @Expose()
  @ApiProperty()
  test_path: string;

  @Expose()
  @ApiProperty()
  target: string;

  @Expose()
  @ApiProperty()
  priority: number;

  @Expose()
  @ApiProperty()
  created_at: string;

  @Expose()
  @ApiProperty()
  updated_at: string;

  @Expose()
  @ApiProperty()
  logs: string[];
}
