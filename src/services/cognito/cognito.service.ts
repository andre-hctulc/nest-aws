import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderClientConfig,
    DescribeUserPoolClientCommand,
    DescribeUserPoolCommand,
    UserPoolType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Injectable } from "@nestjs/common";
import { SearchParams, type AWSContext } from "../../types.js";
import * as oidc from "openid-client";
import { mergeSearchParams, paramsToString, parsePath } from "../../util.js";

type DiscoveryArgs = Parameters<typeof oidc.discovery> extends [any, ...infer A] ? A : [];

/**
 * Provides an S3 client
 */
@Injectable()
export class CognitoService {
    readonly client: CognitoIdentityProviderClient;
    #context: AWSContext;

    constructor(context: AWSContext, config?: Partial<CognitoIdentityProviderClientConfig>) {
        this.#context = context;
        this.client = new CognitoIdentityProviderClient({
            region: context.defaultRegion,
            credentials: context.credentials,
            ...config,
        });
    }

    /**
     * Get the user pool URL.
     * @example 
     * userPoolUrl("us-east-1_123456789", "/.well-known/jwks.json")
     */
    userPoolUrl(poolId: string, path?: string, search?: SearchParams): string {
        return `https://cognito-idp.${this.#context.defaultRegion}.amazonaws.com/${poolId}${parsePath(
            path
        )}${paramsToString(mergeSearchParams(search || {}))}`;
    }

    private poolIdToDomain(poolId: string) {
        // aws urls don't use underscores in the domain, but user pool ids might include them,
        // they are removed
        return poolId.replace("_", "");
    }

    /**
     * Get the auth domain. The domain is for authentication purposes like login, logout, etc.
     */
    authUrl(poolId: string, path?: string, search?: SearchParams): string {
        poolId = this.poolIdToDomain(poolId);
        return `https://${poolId}.auth.${this.#context.defaultRegion}.amazoncognito.com${parsePath(
            path
        )}${paramsToString(mergeSearchParams(search || {}, {}))}`;
    }

    /**
     * @param redirectUri Defaults to the first logout callback URL.
     */
    async logoutUrl(
        poolId: string,
        clientId: string,
        redirectUri?: string,
        search?: SearchParams
    ): Promise<string> {
        const { LogoutURLs } = await this.describeUserPoolClient(poolId, clientId);
        return this.authUrl(
            poolId,
            "logout",
            mergeSearchParams(
                { client_id: clientId, logout_uri: redirectUri || LogoutURLs?.[0] || "" },
                search || {}
            )
        );
    }

    /**
     * Discovers the openid configuration for the user pool and creates an `openid-client` configuration.
     */
    openidClient(poolId: string, ...args: DiscoveryArgs): Promise<oidc.Configuration> {
        return oidc.discovery(new URL(this.userPoolUrl(poolId)), ...args);
    }

    /**
     * Describes the user pool using the {@link DescribeUserPoolCommand}.
     */
    async describeUserPool(poolId: string, region?: string): Promise<UserPoolType> {
        if (!region) {
            region = this.#context.defaultRegion;
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
            region = this.#context.defaultRegion;
        }
        const command = new DescribeUserPoolClientCommand({ ClientId: clientId, UserPoolId: poolId });

        const data = await this.client.send(command);

        if (!data.UserPoolClient) {
            throw new Error("UserPoolClient is undefined");
        }

        return data.UserPoolClient;
    }
}
