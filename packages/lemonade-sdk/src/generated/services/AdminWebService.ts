/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__routers__admin_web__GoogleAuthRequest } from '../models/app__routers__admin_web__GoogleAuthRequest';
import type { AppCreate } from '../models/AppCreate';
import type { Body_admin_upload_storage_file_admin_apps__app_id__storage_upload_post } from '../models/Body_admin_upload_storage_file_admin_apps__app_id__storage_upload_post';
import type { EmailTemplateCreate } from '../models/EmailTemplateCreate';
import type { EmailTemplateUpdate } from '../models/EmailTemplateUpdate';
import type { PlanCreate } from '../models/PlanCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminWebService {
    /**
     * Admin Login Page
     * Admin login page with Google Sign-In.
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminLoginPageAdminLoginGet(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/login',
        });
    }
    /**
     * Admin Google Auth
     * Handle Google Sign-In callback.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminGoogleAuthAdminAuthGooglePost(
        requestBody: app__routers__admin_web__GoogleAuthRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/auth/google',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Logout
     * Logout and clear admin session.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminLogoutAdminLogoutGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/logout',
        });
    }
    /**
     * Admin Apps Page
     * List all apps.
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminAppsPageAdminGet(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin',
        });
    }
    /**
     * Create App Web
     * Create a new app (web form).
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createAppWebAdminAppsPost(
        requestBody: AppCreate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/apps',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Plans Page
     * List plans for an app.
     * @param appId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminPlansPageAdminAppsAppIdPlansGet(
        appId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/plans',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Plan Web
     * Create a new plan (web form).
     * @param appId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createPlanWebAdminAppsAppIdPlansPost(
        appId: number,
        requestBody: PlanCreate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/apps/{app_id}/plans',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Users Page
     * List users for an app.
     * @param appId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminUsersPageAdminAppsAppIdUsersGet(
        appId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/users',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Organizations Page
     * List organizations for an app.
     * @param appId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminOrganizationsPageAdminAppsAppIdOrganizationsGet(
        appId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/organizations',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate User Token
     * Generate a JWT token for a user (admin use).
     * @param appId
     * @param userId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateUserTokenAdminAppsAppIdUsersUserIdGenerateTokenPost(
        appId: number,
        userId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/apps/{app_id}/users/{user_id}/generate-token',
            path: {
                'app_id': appId,
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Organization Detail Page
     * Organization detail page.
     * @param appId
     * @param orgId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminOrganizationDetailPageAdminAppsAppIdOrganizationsOrgIdGet(
        appId: number,
        orgId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/organizations/{org_id}',
            path: {
                'app_id': appId,
                'org_id': orgId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Email Templates Page
     * List email templates for an app.
     * @param appId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminEmailTemplatesPageAdminAppsAppIdEmailTemplatesGet(
        appId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/email-templates',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Email Template Web
     * Create a new email template (web form).
     * @param appId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createEmailTemplateWebAdminAppsAppIdEmailTemplatesPost(
        appId: number,
        requestBody: EmailTemplateCreate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/apps/{app_id}/email-templates',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Email Template Web
     * Update an email template (web form).
     * @param appId
     * @param templateId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateEmailTemplateWebAdminAppsAppIdEmailTemplatesTemplateIdPut(
        appId: number,
        templateId: number,
        requestBody: EmailTemplateUpdate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin/apps/{app_id}/email-templates/{template_id}',
            path: {
                'app_id': appId,
                'template_id': templateId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Email Template Web
     * Delete an email template (web form).
     * @param appId
     * @param templateId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteEmailTemplateWebAdminAppsAppIdEmailTemplatesTemplateIdDelete(
        appId: number,
        templateId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/apps/{app_id}/email-templates/{template_id}',
            path: {
                'app_id': appId,
                'template_id': templateId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Storage Page
     * Storage management page for an app.
     * @param appId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static adminStoragePageAdminAppsAppIdStorageGet(
        appId: number,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/storage',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin List Storage Files
     * List files in storage for an app.
     * @param appId
     * @param folder
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminListStorageFilesAdminAppsAppIdStorageFilesGet(
        appId: number,
        folder: string = 'shared',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/storage/files',
            path: {
                'app_id': appId,
            },
            query: {
                'folder': folder,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Upload Storage File
     * Upload a file to storage.
     * @param appId
     * @param folder
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminUploadStorageFileAdminAppsAppIdStorageUploadPost(
        appId: number,
        folder: string = 'shared',
        formData?: Body_admin_upload_storage_file_admin_apps__app_id__storage_upload_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/apps/{app_id}/storage/upload',
            path: {
                'app_id': appId,
            },
            query: {
                'folder': folder,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Get Signed Url
     * Get a signed URL for a file.
     * @param appId
     * @param path
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminGetSignedUrlAdminAppsAppIdStorageSignedUrlGet(
        appId: number,
        path: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/apps/{app_id}/storage/signed-url',
            path: {
                'app_id': appId,
            },
            query: {
                'path': path,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Admin Delete Storage File
     * Delete a file from storage.
     * @param appId
     * @param path
     * @returns any Successful Response
     * @throws ApiError
     */
    public static adminDeleteStorageFileAdminAppsAppIdStorageFileDelete(
        appId: number,
        path: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/apps/{app_id}/storage/file',
            path: {
                'app_id': appId,
            },
            query: {
                'path': path,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
