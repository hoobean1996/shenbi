/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProgressCreate } from '../models/ProgressCreate';
import type { ProgressResponse } from '../models/ProgressResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShenbiProgressService {
    /**
     * Get All Progress
     * Get all progress for current user.
     * @param xApiKey
     * @returns ProgressResponse Successful Response
     * @throws ApiError
     */
    public static getAllProgressApiV1ShenbiProgressGet(
        xApiKey: string,
    ): CancelablePromise<Array<ProgressResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/progress',
            headers: {
                'X-API-Key': xApiKey,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Save Progress
     * Save progress for a level.
     * @param xApiKey
     * @param requestBody
     * @returns ProgressResponse Successful Response
     * @throws ApiError
     */
    public static saveProgressApiV1ShenbiProgressPost(
        xApiKey: string,
        requestBody: ProgressCreate,
    ): CancelablePromise<ProgressResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/shenbi/progress',
            headers: {
                'X-API-Key': xApiKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Adventure Progress
     * Get progress for a specific adventure.
     * @param adventureId
     * @param xApiKey
     * @returns ProgressResponse Successful Response
     * @throws ApiError
     */
    public static getAdventureProgressApiV1ShenbiProgressAdventureAdventureIdGet(
        adventureId: number,
        xApiKey: string,
    ): CancelablePromise<Array<ProgressResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/progress/adventure/{adventure_id}',
            path: {
                'adventure_id': adventureId,
            },
            headers: {
                'X-API-Key': xApiKey,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Level Progress
     * Get progress for a specific level.
     * @param adventureId
     * @param levelId
     * @param xApiKey
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getLevelProgressApiV1ShenbiProgressLevelAdventureIdLevelIdGet(
        adventureId: number,
        levelId: number,
        xApiKey: string,
    ): CancelablePromise<(ProgressResponse | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/progress/level/{adventure_id}/{level_id}',
            path: {
                'adventure_id': adventureId,
                'level_id': levelId,
            },
            headers: {
                'X-API-Key': xApiKey,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
