/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameType } from './GameType';
export type AdventureCreate = {
    slug: string;
    name: string;
    description?: (string | null);
    icon?: (string | null);
    game_type?: GameType;
    complexity?: number;
    age_range?: (string | null);
    tags?: (Array<string> | null);
    concepts?: (Array<string> | null);
    stdlib_functions?: (Array<string> | null);
    is_published?: boolean;
    sort_order?: number;
};

