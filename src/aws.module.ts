import { AWS_CONTEXT_KEY, type AWSContext } from "./context.js";
import {
    Module,
    type DynamicModule,
    type InjectionToken,
    type OptionalFactoryDependency,
    type Provider,
} from "@nestjs/common";

export type AWSServiceInterface = new (context: AWSContext, ...args: any) => any;
type AWSServiceArgs<T> = T extends new (context: AWSContext, ...args: infer A) => any ? A : never;

export interface AWSServiceConfig<S extends AWSServiceInterface = AWSServiceInterface> {
    service: AWSServiceInterface;
    args:
        | AWSServiceArgs<S>
        | {
              useFactory: (...args: any) => AWSServiceArgs<S> | Promise<AWSServiceArgs<S>>;
              inject?: (InjectionToken | OptionalFactoryDependency)[];
          };
}

export function configFor<S extends AWSServiceInterface>(
    service: S,
    ...args: AWSServiceArgs<S>
): AWSServiceConfig<S> {
    return { service, args };
}

/**
 * Omits system fields from the context.
 */
type UserContext = Omit<Partial<AWSContext>, `_${string}`>;

export interface GlobalAWSModuleSetup {
    /**
     * AWS context like credentials and region.
     */
    context:
        | UserContext
        | {
              useFactory: (...args: any) => UserContext | Promise<UserContext>;
              inject?: (InjectionToken | OptionalFactoryDependency)[];
          };
    services?: AWSServiceConfig[];
    /**
     * Global module?
     */
    global?: boolean;
}

@Module({})
export class AWSModule {
    // SEE https://docs.nestjs.com/fundamentals/dynamic-modules#community-guidelines for naming conventions
    static forRoot({ context, services, global }: GlobalAWSModuleSetup): DynamicModule {
        const ctxInj = "inject" in context ? context.inject || [] : [];
        const activeServices: AWSServiceConfig[] = services || [];

        let resolveCtx: ((value: UserContext) => Promise<void>) | undefined;
        let rejectCtx: ((reason?: any) => void) | undefined;

        /**
         * This promise awaits the context initialization, so we can mount secrets before the services are initialized.
         * This way the services can access the secrets synchronously.
         */
        const ctxPromise: Promise<void> = new Promise(async (res, rej) => {
            // On context resolve we check if we have secrets to load before module initialization
            // We define the secrets on the context which we receive from the context provider factory
            resolveCtx = async (userCtx) => {
                const ctx = userCtx as AWSContext;
                // Init system object
                ctx._system = { defaultSecrets: {} };

                if (!ctx.defaultRegion) {
                    ctx.defaultRegion = "us-east-1";
                }

                const secretsNames = Array.isArray(ctx.secrets)
                    ? ctx.secrets
                    : ctx.secrets
                    ? [ctx.secrets]
                    : [];

                // populate secrets if we have any
                if (secretsNames.length) {
                    // Only load secrets module if we have secrets to load
                    const { SecretsManagerService } = await import("./services/secrets-manager/index.js");

                    for (const secretName of secretsNames) {
                        ctx._system.defaultSecrets[secretName] = await SecretsManagerService.loadSecret(
                            userCtx.credentials,
                            ctx.defaultRegion,
                            secretName
                        );
                    }
                }
                res();
            };
            rejectCtx = rej;
        });

        return {
            global,
            providers: [
                // Context Provide Factory
                {
                    provide: AWS_CONTEXT_KEY,
                    useFactory: async (...injections) => {
                        if ("useFactory" in context) {
                            let ctx = await context.useFactory(...injections);
                            ctx = { ...ctx };
                            // resolve context
                            await resolveCtx?.(ctx);
                            return ctx;
                        } else {
                            let ctx = { ...context };
                            // resolve context
                            await resolveCtx?.(ctx);
                            return ctx;
                        }
                    },
                    inject: ctxInj,
                }, // Service factories
                ...activeServices.map<Provider>((obj) => {
                    const Service = obj.service;
                    const inj = "inject" in obj.args ? obj.args.inject || [] : [];

                    return {
                        provide: Service,
                        useFactory: async (context: AWSContext, ...injections) => {
                            // await secrets promise, so
                            await ctxPromise;

                            if ("useFactory" in obj.args) {
                                const args = await (obj.args as any).useFactory(...injections);
                                return new Service(context, ...args);
                            } else {
                                return new Service(context, ...(obj.args as any[]));
                            }
                        },
                        inject: [AWS_CONTEXT_KEY, ...inj],
                    };
                }),
            ],
            module: AWSModule,
            exports: [AWS_CONTEXT_KEY, ...activeServices.map(({ service }) => service)],
        };
    }
}
