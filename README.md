# tsdev

[NestJS](https://nestjs.com) x AWS

## Usage

```ts
import { AWSModule, configFor } from "nest-aws";
import { S3Service } from "nest-aws/s3";
import { SecretsManagerService } from "nest-aws/secrets-manager";

@Module({
    imports: [
        AWSModule.configure({
            // Can be a factory
            context: {
                credentials: { ... },
            },
            // `configFor` takes arguments for service constructors
            services: [
                configFor(S3Service, {} /* custom s3 client config */),
                configFor(SecretsManagerService)
            ],
            global: false,
            defaultRegion: "us-east-1"
        }),
    ],
})
class AppModule {}
```
