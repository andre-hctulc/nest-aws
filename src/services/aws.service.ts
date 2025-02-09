import { Inject, Injectable } from "@nestjs/common";
import { AWS_CONTEXT_KEY, type AWSContext } from "../context.js";

/**
 * Always provided
 */
@Injectable()
export class AWSService {
    #context: AWSContext;

    constructor(@Inject(AWS_CONTEXT_KEY) context: AWSContext) {
        this.#context = context;
    }

    get defaultRegion() {
        return this.#context.defaultRegion;
    }
}
