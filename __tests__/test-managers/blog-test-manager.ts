import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogViewModel} from "../../src/features/blogs/models/BlogViewModel";

export const blogTestManager = {
    async createBlog(data: any, expectedStatusCode: number, auth: string) {
        const response = await req
            .post(SETTINGS.PATH.BLOGS)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdBlog: BlogViewModel = response.body;
            expect(createdBlog).toEqual({
                id: expect.any(String),
                name: data.name,
                description: data.description,
                websiteUrl: data.websiteUrl,
                createdAt: expect.any(String),
                isMembership: false,
            });

            expect(isNaN(new Date(createdBlog.createdAt).getTime())).toBe(false);

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + createdBlog.id)
                .expect(HTTP_STATUSES.OK_200, createdBlog);
        }

        return response;
    },
    async updateBlog(blogId: string, data: any, expectedStatusCode: number, auth: string) {
        const getBlogResponse = await req
            .get(SETTINGS.PATH.BLOGS + '/' + blogId);

        const response = await req
            .put(SETTINGS.PATH.BLOGS + '/' + blogId)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const blogBeforeUpdate: BlogViewModel = getBlogResponse.body;

            const getUpdatedBlogResponse = await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId)
                .expect(HTTP_STATUSES.OK_200);
            const updatedBlog: BlogViewModel = getUpdatedBlogResponse.body;

            expect(updatedBlog).toEqual({
                id: blogBeforeUpdate.id,
                name: data.name,
                description: data.description,
                websiteUrl: data.websiteUrl,
                createdAt: blogBeforeUpdate.createdAt,
                isMembership: blogBeforeUpdate.isMembership,
            });
        }

        return response;
    },
};