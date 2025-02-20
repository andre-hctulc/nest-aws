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

export function mergeSearchParams(...params: SearchParams[]) {
    const search = new URLSearchParams();

    for (const param of params) {
        const searchParams = parseSearchParams(param);
        for (const key of searchParams.keys()) {
            for (const value of searchParams.getAll(key)) {
                search.append(key, value);
            }
        }
    }

    return search;
}

export function paramsToString(params: URLSearchParams) {
    return params.size > 0 ? "?" + params.toString() : "";
}

export function parsePath(path: string | undefined) {
    if (path && !path.startsWith("/")) {
        return `/${path}`;
    }
    return path || "";
}
