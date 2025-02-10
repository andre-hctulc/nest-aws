import { Injectable, PreconditionFailedException } from "@nestjs/common";
import { STS } from "@aws-sdk/client-sts";

const stsClient = new STS();

@Injectable()
export class STSService {
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

        const { Credentials } = await stsClient.assumeRole({
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
