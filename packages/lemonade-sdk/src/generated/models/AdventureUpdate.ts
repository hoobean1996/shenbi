/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameType } from './GameType';
export type AdventureUpdate = {
    slug?: (string | null);
    name?: (string | null);
    description?: (string | null);
    icon?: (string | null);
    game_type?: (GameType | null);
    complexity?: (number | null);
    age_range?: (string | null);
    tags?: (Array<string> | null);
    concepts?: (Array<string> | null);
    stdlib_functions?: (Array<string> | null);
    is_published?: (boolean | null);
    sort_order?: (number | null);
};

