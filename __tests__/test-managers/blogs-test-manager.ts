import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogViewModel} from "../../src/features/blogs/models/BlogViewModel";
import {blogsCollection} from "../../src/db/db";
import {VALID_AUTH} from "../datasets/authorization-data";
import {postsTestManager} from "./posts-test-manager";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";

export const blogsTestManager = {
    async deleteBlog(blogId: string, expectedStatusCode: number, auth: string = VALID_AUTH) {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/' + blogId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const dbDeletedBlog = await blogsCollection
                .findOne({ id: blogId, isDeleted: false });
            expect(dbDeletedBlog).toEqual(null);
        }
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

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + createdBlog.id)
                .expect(HTTP_STATUSES.OK_200);
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
    async createBlogPost(blogId: string, data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
        const response = await req
            .post(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts')
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdPost: PostViewModel = response.body;
            const input = { ...data, blogId };
            await postsTestManager.verifyCreatedPost(input, createdPost);
        }

        return response;
    },
};