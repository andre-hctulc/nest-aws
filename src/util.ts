import type { AWSContext } from "./context.js";

export const emptyContext: () => AWSContext = () => ({
    defaultRegion: "us-east-1",
    credentials: undefined,
    _system: { defaultSecrets: {} },
    secrets: [],
});
