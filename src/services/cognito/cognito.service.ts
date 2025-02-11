import {
    CognitoIdentityProviderClient,
    DescribeUserPoolCommand,
    UserPoolType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Injectable } from "@nestjs/common";
import { type AWSContext } from "../../types.js";
import * as oidc from "openid-client";

type DiscoveryArgs = Parameters<typeof oidc.discovery> extends [any, ...infer A] ? A : [];

/**
 * Provides an S3 client
 */
@Injectable()
export class CognitoService {
    readonly client: CognitoIdentityProviderClient;

    constructor(private context: AWSContext) {
        this.client = new CognitoIdentityProviderClient({
            region: context.defaultRegion,
            credentials: context.credentials,
        });
    }

    /**
     * Discovers the openid configuration for the user pool and creates an `openid-client` configuration.
     */
    async openidClient(poolId: string, ...args: DiscoveryArgs): Promise<oidc.Configuration> {
        const { Id } = await this.describe(poolId);
        const url = `https://cognito-idp.${this.client.config.region}.amazonaws.com/${Id}`;
        return oidc.discovery(new URL(url), ...args);
    }

    /**
     * Describes the user pool using the {@link DescribeUserPoolCommand}.
     */
    async describe(poolId: string, region?: string): Promise<UserPoolType> {
        if (!region) {
            region = this.context.defaultRegion;
        }

        // Optionally, you can get the user pool id dynamically using DescribeUserPool, if needed
        const client = new CognitoIdentityProviderClient({ region });
        const command = new DescribeUserPoolCommand({ UserPoolId: poolId });

        const data = await client.send(command);

        if (!data.UserPool) {
            throw new Error("UserPool is undefined");
        }

        return data.UserPool;
    }

    /**
     * Returns the URL for the user pool.
     */
    getUrl(poolId: string) {
        return `https://cognito-idp.${this.client.config.region}.amazonaws.com/${poolId}`;
    }
}
