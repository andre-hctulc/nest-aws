# nest-aws

[NestJS](https://nestjs.com) x AWS (v3)

## Usage

```ts
@Module({
    imports: [
        AWSModule.configure({
            // Can be a factory
            context: {
                credentials: { ... },
            },
            services: [configFor(S3Service)],
            global: false,
            defaultRegion: "us-east-1"
        }),
    ],
})
class AppModule {}
```
