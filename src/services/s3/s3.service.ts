import { Injectable } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import { type AWSContext } from "../../types.js";

/**
 * Provides an S3 client
 */
@Injectable()
export class S3Service {
    readonly client: S3Client;

    constructor(context: AWSContext) {
        this.client = new S3Client({
            region: context.defaultRegion,
            credentials: context.credentials,
        });
    }
}
