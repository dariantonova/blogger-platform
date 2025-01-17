import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";
import {blogsCollection, postsCollection} from "../../src/db/db";
import {VALID_AUTH} from "../datasets/authorization-data";
import {CreatePostInputModel} from "../../src/features/posts/models/CreatePostInputModel";

export const postTestManager = {
    async deletePost(postId: string, expectedStatusCode: number, auth: string = VALID_AUTH) {
        await req
            .delete(SETTINGS.PATH.POSTS + '/' + postId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const dbPostToDelete = await postsCollection
                .findOne({ id: postId, isDeleted: false });
            expect(dbPostToDelete).toEqual(null);
        }
    },
    async createPost(data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
        const response = await req
            .post(SETTINGS.PATH.POSTS)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdPost: PostViewModel = response.body;
            await this.verifyCreatedPost(data, createdPost);
        }

        return response;
    },
    async verifyCreatedPost(input: CreatePostInputModel, createdPost: PostViewModel) {
        const dbRelatedBlog = await blogsCollection
            .findOne({ id: createdPost.blogId }, { projection: { _id: 0 } });

        expect(createdPost).toEqual({
            id: expect.any(String),
            title: input.title,
            shortDescription: input.shortDescription,
            content: input.content,
            blogId: input.blogId,
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
            blogName: createdPost.blogName,
            createdAt: createdPost.createdAt,
            isDeleted: false,
        });
    },
    async updatePost(postId: string, data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
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
            if (!dbUpdatedPost) throw new Error('Updated post not found');

            const dbCurrentRelatedBlog = await blogsCollection
                .findOne({ id: dbUpdatedPost.blogId }, { projection: { _id: 0 } });
            if (!dbCurrentRelatedBlog) throw new Error('Blog of updated post not found');

            // duplicate fields
            const additionalChanges = {
                blogName: dbCurrentRelatedBlog.name,
            };

            expect(dbUpdatedPost).toEqual({
                ...dbPostBeforeUpdate,
                ...data,
                ...additionalChanges,
            });
        }

        return response;
    },
    async createPostComment(postId: string, data: any, auth: string, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.POSTS + '/' + postId + '/comments')
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);
    },
    async getPostComments(postId: string, expectedStatusCode: number, query: string = '') {
        return req
            .get(SETTINGS.PATH.POSTS + '/' + postId + '/comments' + '?' + query)
            .expect(expectedStatusCode);
    },
};