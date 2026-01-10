/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdventureCreate } from '../models/AdventureCreate';
import type { AdventureListResponse } from '../models/AdventureListResponse';
import type { AdventureResponse } from '../models/AdventureResponse';
import type { AdventureUpdate } from '../models/AdventureUpdate';
import type { LevelCreate } from '../models/LevelCreate';
import type { LevelResponse } from '../models/LevelResponse';
import type { LevelUpdate } from '../models/LevelUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShenbiAdventuresService {
    /**
     * List Adventures
     * List all adventures.
     * @param xApiKey
     * @param publishedOnly
     * @param gameType
     * @returns AdventureListResponse Successful Response
     * @throws ApiError
     */
    public static listAdventuresApiV1ShenbiAdventuresGet(
        xApiKey: string,
        publishedOnly: boolean = true,
        gameType?: (string | null),
    ): CancelablePromise<Array<AdventureListResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/adventures',
            headers: {
                'X-API-Key': xApiKey,
            },
            query: {
                'published_only': publishedOnly,
                'game_type': gameType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Adventure
     * Create a new adventure (admin only).
     * @param xApiKey
     * @param requestBody
     * @returns AdventureResponse Successful Response
     * @throws ApiError
     */
    public static createAdventureApiV1ShenbiAdventuresPost(
        xApiKey: string,
        requestBody: AdventureCreate,
    ): CancelablePromise<AdventureResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/shenbi/adventures',
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
     * Get Adventure
     * Get an adventure with its levels.
     * @param adventureId
     * @param xApiKey
     * @returns AdventureResponse Successful Response
     * @throws ApiError
     */
    public static getAdventureApiV1ShenbiAdventuresAdventureIdGet(
        adventureId: number,
        xApiKey: string,
    ): CancelablePromise<AdventureResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/adventures/{adventure_id}',
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
     * Update Adventure
     * Update an adventure (admin only).
     * @param adventureId
     * @param xApiKey
     * @param requestBody
     * @returns AdventureResponse Successful Response
     * @throws ApiError
     */
    public static updateAdventureApiV1ShenbiAdventuresAdventureIdPut(
        adventureId: number,
        xApiKey: string,
        requestBody: AdventureUpdate,
    ): CancelablePromise<AdventureResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/shenbi/adventures/{adventure_id}',
            path: {
                'adventure_id': adventureId,
            },
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
     * Delete Adventure
     * Delete an adventure (admin only).
     * @param adventureId
     * @param xApiKey
     * @returns void
     * @throws ApiError
     */
    public static deleteAdventureApiV1ShenbiAdventuresAdventureIdDelete(
        adventureId: number,
        xApiKey: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/shenbi/adventures/{adventure_id}',
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
     * List Levels
     * List levels for an adventure.
     * @param adventureId
     * @param xApiKey
     * @returns LevelResponse Successful Response
     * @throws ApiError
     */
    public static listLevelsApiV1ShenbiAdventuresAdventureIdLevelsGet(
        adventureId: number,
        xApiKey: string,
    ): CancelablePromise<Array<LevelResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/shenbi/adventures/{adventure_id}/levels',
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
     * Create Level
     * Create a new level (admin only).
     * @param adventureId
     * @param xApiKey
     * @param requestBody
     * @returns LevelResponse Successful Response
     * @throws ApiError
     */
    public static createLevelApiV1ShenbiAdventuresAdventureIdLevelsPost(
        adventureId: number,
        xApiKey: string,
        requestBody: LevelCreate,
    ): CancelablePromise<LevelResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/shenbi/adventures/{adventure_id}/levels',
            path: {
                'adventure_id': adventureId,
            },
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
     * Update Level
     * Update a level (admin only).
     * @param adventureId
     * @param levelId
     * @param xApiKey
     * @param requestBody
     * @returns LevelResponse Successful Response
     * @throws ApiError
     */
    public static updateLevelApiV1ShenbiAdventuresAdventureIdLevelsLevelIdPut(
        adventureId: number,
        levelId: number,
        xApiKey: string,
        requestBody: LevelUpdate,
    ): CancelablePromise<LevelResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/shenbi/adventures/{adventure_id}/levels/{level_id}',
            path: {
                'adventure_id': adventureId,
                'level_id': levelId,
            },
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
     * Delete Level
     * Delete a level (admin only).
     * @param adventureId
     * @param levelId
     * @param xApiKey
     * @returns void
     * @throws ApiError
     */
    public static deleteLevelApiV1ShenbiAdventuresAdventureIdLevelsLevelIdDelete(
        adventureId: number,
        levelId: number,
        xApiKey: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/shenbi/adventures/{adventure_id}/levels/{level_id}',
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
