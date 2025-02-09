import { Inject, Injectable } from "@nestjs/common";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { AWS_CONTEXT_KEY, type AWSContext, type AWSCredentials } from "../context.js";

/**
 * Service to interact with AWS Secrets Manager.
 * Provides the client and some helper methods to get secrets.
 * @param defaultSecret The default secret to use on {@link get} if no secret is provided.
 */
@Injectable()
export class SecretsManagerService {
    readonly client: SecretsManagerClient;
    private defaultSecretPromise: Promise<Record<string, any>> | undefined;
    #context: AWSContext;

    constructor(@Inject(AWS_CONTEXT_KEY) context: AWSContext) {
        this.#context = context;
        this.client = new SecretsManagerClient({
            region: context.defaultRegion,
            credentials: context.credentials,
        });
    }

    static async loadSecret(
        credentials: AWSCredentials | SecretsManagerClient,
        secretName: string,
        versionStage: string = "AWSCURRENT"
    ): Promise<Record<string, any>> {
        const client =
            credentials instanceof SecretsManagerClient
                ? credentials
                : new SecretsManagerClient({ credentials });
        const response = await client.send(
            new GetSecretValueCommand({
                SecretId: secretName,
                VersionStage: versionStage,
            })
        );

        if (!response.SecretString) {
            throw new Error("Secret is empty");
        }

        try {
            return JSON.parse(response.SecretString);
        } catch (e) {
            throw new Error("Failed to parse secret");
        }
    }

    /**
     * Loads a secret from AWS Secrets Manager.
     */
    async loadSecret(secretName: string, versionStage: string = "AWSCURRENT"): Promise<Record<string, any>> {
        return SecretsManagerService.loadSecret(this.client, secretName, versionStage);
    }

    /**
     * Gets a variable from a default secret (by default the first one).
     */
    get<T = any>(varName: string, secretName?: string): Promise<T> {
        const keys = Object.keys(this.#context._system.defaultSecrets || {});

        if (!keys.length) {
            throw new Error("No default secrets loaded");
        }

        secretName = secretName || keys[0];
        const secret = this.#context._system.defaultSecrets[secretName];

        if (!secret) {
            throw new Error(`Secret '${secretName}' not loaded`);
        }

        return secret[varName];
    }
}
