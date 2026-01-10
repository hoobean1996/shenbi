/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LevelResponse } from './LevelResponse';
/**
 * Adventure with levels - for detail endpoints.
 */
export type AdventureResponse = {
    id: number;
    app_id: number;
    slug: string;
    name: string;
    description: (string | null);
    icon: (string | null);
    game_type: string;
    complexity: number;
    age_range: (string | null);
    tags: null;
    concepts: null;
    stdlib_functions: null;
    is_published: boolean;
    sort_order: number;
    created_at: string;
    levels?: Array<LevelResponse>;
};

