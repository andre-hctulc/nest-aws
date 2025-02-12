import {
    CognitoIdentityProviderClient,
    DescribeUserPoolClientCommand,
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
        const url = `https://cognito-idp.${this.client.config.region}.amazonaws.com/${poolId}`;
        return oidc.discovery(new URL(url), ...args);
    }

    /**
     * Describes the user pool using the {@link DescribeUserPoolCommand}.
     */
    async describeUserPool(poolId: string, region?: string): Promise<UserPoolType> {
        if (!region) {
            region = this.context.defaultRegion;
        }

        const command = new DescribeUserPoolCommand({ UserPoolId: poolId });
        const data = await this.client.send(command);

        if (!data.UserPool) {
            throw new Error("UserPool is undefined");
        }

        return data.UserPool;
    }

    async describeUserPoolClient(poolId: string, clientId: string, region?: string) {
        if (!region) {
            region = this.context.defaultRegion;
        }
        const command = new DescribeUserPoolClientCommand({ ClientId: clientId, UserPoolId: poolId });

        const data = await this.client.send(command);

        if (!data.UserPoolClient) {
            throw new Error("UserPoolClient is undefined");
        }

        return data.UserPoolClient;
    }

    /**
     * Returns the URL for the user pool.
     */
    getUrl(poolId: string) {
        return `https://cognito-idp.${this.client.config.region}.amazonaws.com/${poolId}`;
    }
}
