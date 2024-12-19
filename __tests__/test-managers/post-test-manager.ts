import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";
import {blogsCollection, postsCollection} from "../../src/db/db";

export const postTestManager = {
    async createPost(data: any, expectedStatusCode: number, auth: string) {
        const response = await req
            .post(SETTINGS.PATH.POSTS)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdPost: PostViewModel = response.body;
            const dbRelatedBlog = await blogsCollection
                .findOne({ id: createdPost.blogId }, { projection: { _id: 0 } });

            expect(createdPost).toEqual({
                id: expect.any(String),
                title: data.title,
                shortDescription: data.shortDescription,
                content: data.content,
                blogId: data.blogId,
                blogName: dbRelatedBlog?.name || '',
                createdAt: expect.any(String),
            });

            expect(isNaN(new Date(createdPost.createdAt).getTime())).toBe(false);

            const dbCreatedPost = await postsCollection
                .findOne({ id: createdPost.id }, { projection: { _id: 0 } });
            expect(dbCreatedPost).toEqual({
                id: createdPost.id,
                title: createdPost.title,
                shortDescription: createdPost.shortDescription,
                content: createdPost.content,
                blogId: createdPost.blogId,
                createdAt: createdPost.createdAt,
                isDeleted: false,
            });
        }

        return response;
    },
    async updatePost(postId: string, data: any, expectedStatusCode: number, auth: string) {
        const dbPostBeforeUpdate = await postsCollection
            .findOne({ id: postId }, { projection: { _id: 0 } });

        const response = await req
            .put(SETTINGS.PATH.POSTS + '/' + postId)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const dbUpdatedPost = await postsCollection
                .findOne({ id: postId }, { projection: { _id: 0 } });

            expect(dbUpdatedPost).toEqual({
                ...dbPostBeforeUpdate,
                ...data,
            });
        }

        return response;
    },
};