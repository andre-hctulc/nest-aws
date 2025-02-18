import {
    CognitoIdentityProviderClient,
    DescribeUserPoolClientCommand,
    DescribeUserPoolCommand,
    UserPoolType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Injectable } from "@nestjs/common";
import { SearchParams, type AWSContext } from "../../types.js";
import * as oidc from "openid-client";
import { mergeSearchParams, paramsToString } from "../../util.js";

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
     * Get the user pool URL.
     */
    userPoolUrl(poolId: string, path?: string, search?: SearchParams): string {
        if (path && !path.startsWith("/")) {
            path = `/${path}`;
        }
        return `https://cognito-idp.${
            this.context.defaultRegion
        }.amazonaws.com/${poolId}${path}${paramsToString(mergeSearchParams(search || {}, {}))}`;
    }

    /**
     * Discovers the openid configuration for the user pool and creates an `openid-client` configuration.
     */
    openidClient(poolId: string, ...args: DiscoveryArgs): Promise<oidc.Configuration> {
        return oidc.discovery(new URL(this.userPoolUrl(poolId)), ...args);
    }

    /**
     * Get the auth domain. The domain is for authentication purposes like login, logout, etc.
     */
    authUrl(poolId: string, path?: string, search?: SearchParams): string {
        if (path && !path.startsWith("/")) {
            path = `/${path}`;
        }
        return `https://${poolId}.auth.${this.context.defaultRegion}.amazoncognito.com${path}${paramsToString(
            mergeSearchParams(search || {}, {})
        )}`;
    }

    async logoutUrl(poolId: string, clientId: string, search?: SearchParams): Promise<string> {
        const { LogoutURLs } = await this.describeUserPoolClient(poolId, clientId);
        const defaultSearch = new URLSearchParams({ client_id: clientId, logout_uri: LogoutURLs?.[0] || "" });
        return `${this.authUrl(poolId)}/logout?${paramsToString(
            mergeSearchParams(defaultSearch, search || {})
        )}`;
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
}
