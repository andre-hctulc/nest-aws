import { Injectable } from "@nestjs/common";
import { type AWSContext } from "../../types.js";
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TranslateConfig } from "@aws-sdk/lib-dynamodb";

@Injectable()
export class DynamoDBService {
    readonly client: DynamoDBClient;
    readonly docClient: DynamoDBDocumentClient;

    constructor(
        context: AWSContext,
        clientConfig?: Partial<DynamoDBClientConfig>,
        docClientConfig?: Partial<TranslateConfig>
    ) {
        this.client = new DynamoDBClient({
            region: context.defaultRegion,
            credentials: context.credentials,
            ...clientConfig,
        });
        this.docClient = DynamoDBDocumentClient.from(this.client, {
            ...docClientConfig,
        });
    }
}
