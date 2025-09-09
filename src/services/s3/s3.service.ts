import { Injectable } from "@nestjs/common";
import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { type AWSContext } from "../../types.js";

/**
 * Provides an S3 client
 */
@Injectable()
export class S3Service {
    readonly client: S3Client;

    constructor(context: AWSContext, config?: Partial<S3ClientConfig>) {
        this.client = new S3Client({
            region: context.defaultRegion,
            credentials: context.credentials,
            ...config,
        });
    }
}
