import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from "@aws-sdk/types";

export type AWSCredentials = AwsCredentialIdentity | AwsCredentialIdentityProvider | undefined;

export interface AWSContext {
    defaultRegion: string;
    credentials: AWSCredentials;
    /**
     * AWS secret names.
     *
     * Secrets to load before the module initialization.
     *
     * All services can access secrets synchronously.
     * After the module initialization, other secrets can only be loaded asynchronously.
     */
    secrets: string | string[];
    _system: {
        /**
         * Loaded default secrets
         */
        defaultSecrets: Record<string, Record<string, any>>;
    };
}

export type SearchParams = URLSearchParams | Record<string, string | string[] | undefined>;
