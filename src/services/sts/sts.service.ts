import { Injectable, PreconditionFailedException } from "@nestjs/common";
import { STS, STSClientConfig } from "@aws-sdk/client-sts";
import type { AWSContext } from "../../types.js";

@Injectable()
export class STSService {
    private client: STS;

    constructor(context: AWSContext, config?: Partial<STSClientConfig>) {
        this.client = new STS({
            region: context.defaultRegion,
            credentials: context.credentials,
            ...config,
        });
    }
    /**
     * @param cacheTime Cache time in seconds
     */
    async assumeS3(
        roleArn: { accountId: string; roleName: string } | string,
        cacheTime: number
    ): Promise<{ AccessKeyId: string; SecretAccessKey: string; SessionToken: string }> {
        const arn =
            typeof roleArn === "string"
                ? roleArn
                : `arn:aws:iam::${roleArn.accountId}:role/${roleArn.roleName}`;
        const sessionName = "AccountXSession";

        const { Credentials } = await this.client.assumeRole({
            RoleArn: arn,
            RoleSessionName: sessionName,
            DurationSeconds: cacheTime,
        });

        if (
            !Credentials ||
            !Credentials.AccessKeyId ||
            !Credentials.SecretAccessKey ||
            !Credentials.SessionToken
        ) {
            throw new PreconditionFailedException("Failed to assume role");
        }

        return Credentials as { AccessKeyId: string; SecretAccessKey: string; SessionToken: string };
    }
}
