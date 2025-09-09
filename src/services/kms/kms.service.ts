import { Injectable } from "@nestjs/common";
import { type AWSContext } from "../../types.js";
import { KMSClient, KMSClientConfig } from "@aws-sdk/client-kms";

@Injectable()
export class KMSService {
    readonly client: KMSClient;

    constructor(context: AWSContext, config?: Partial<KMSClientConfig>) {
        this.client = new KMSClient({
            region: context.defaultRegion,
            credentials: context.credentials,
            ...config,
        });
    }
}
