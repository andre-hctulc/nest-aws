import { Inject, Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import { AWS_CONTEXT_KEY, type AWSContext } from "../context.js";

/**
 * Provides an S3 client
 */
@Injectable()
export class S3Service {
    readonly client: S3Client;

    constructor(@Inject(AWS_CONTEXT_KEY) context: AWSContext) {
        this.client = new S3Client({
            region: context.defaultRegion,
            credentials: context.credentials,
        });
    }
}
