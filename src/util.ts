import { SearchParams } from "./types.js";

function parseSearchParams(search: SearchParams): URLSearchParams {
    if (search instanceof URLSearchParams) {
        return search;
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(search)) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                for (const v of value) {
                    searchParams.append(key, v);
                }
            } else {
                searchParams.set(key, value);
            }
        }
    }

    return searchParams;
}

export function mergeSearchParams(p1: SearchParams, p2: SearchParams) {
    const search = parseSearchParams(p1);
    const p2Search = parseSearchParams(p2);
    for (const key of p2Search.keys()) {
        const values = p2Search.getAll(key);
        for (const value of values) {
            search.append(key, value);
        }
    }
    return search;
}

export function paramsToString(params: URLSearchParams) {
    const hasParams = Object.keys(params).length > 0;
    return hasParams ? "?" + params.toString() : "";
}
