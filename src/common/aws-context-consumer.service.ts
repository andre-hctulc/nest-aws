import { Inject, Injectable } from "@nestjs/common";
import { type AWSContext } from "../types.js";
import { AWS_CONTEXT_KEY } from "../const.js";

/**
 * Always provided
 */
@Injectable()
export class AWSContextConsumerService {
    #context: AWSContext;

    constructor(@Inject(AWS_CONTEXT_KEY) context: AWSContext) {
        this.#context = context;
    }

    get defaultRegion() {
        return this.#context.defaultRegion;
    }
}
