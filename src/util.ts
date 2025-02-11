import type { AWSContext } from "./types.js";

export const emptyContext: () => AWSContext = () => ({
    defaultRegion: "us-east-1",
    credentials: undefined,
    _system: { defaultSecrets: {} },
    secrets: [],
});
