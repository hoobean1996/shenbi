/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to send a templated email.
 */
export type SendTemplateEmailRequest = {
    to: string;
    template_name: string;
    variables?: (Record<string, any> | null);
};

