/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameType } from './GameType';
export type LevelCreate = {
    slug: string;
    name: string;
    description?: (string | null);
    game_type?: GameType;
    grid?: (Record<string, any> | null);
    available_commands?: (Array<string> | null);
    available_sensors?: (Array<string> | null);
    available_blocks?: (Array<string> | null);
    win_condition?: (Record<string, any> | null);
    fail_condition?: (Record<string, any> | null);
    teaching_goal?: (string | null);
    hints?: (Array<string> | null);
    expected_code?: (string | null);
    required_tier?: string;
    sort_order?: number;
};

