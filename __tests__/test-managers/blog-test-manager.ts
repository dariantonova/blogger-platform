import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogViewModel} from "../../src/features/blogs/models/BlogViewModel";
import {blogsCollection} from "../../src/db/db";
import {VALID_AUTH} from "../datasets/authorization-data";

export const blogTestManager = {
    async deleteBlog(blogId: string, expectedStatusCode: number, auth: string = VALID_AUTH) {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/' + blogId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);
    },
    async createBlog(data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
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

            const dbCreatedBlog = await blogsCollection
                .findOne({ id: createdBlog.id }, { projection: { _id: 0 } });
            expect(dbCreatedBlog).toEqual({
                ...createdBlog,
                isDeleted: false,
            });
        }

        return response;
    },
    async updateBlog(blogId: string, data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
        const dbBlogBeforeUpdate = await blogsCollection
            .findOne({ id: blogId }, { projection: { _id: 0 } });

        const response = await req
            .put(SETTINGS.PATH.BLOGS + '/' + blogId)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const dbUpdatedBlog = await blogsCollection
                .findOne({ id: blogId }, { projection: { _id: 0 } });

            expect(dbUpdatedBlog).toEqual({
                ...dbBlogBeforeUpdate,
                ...data,
            });
        }

        return response;
    },
};