import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";
import {blogsRepository} from "../../src/features/blogs/blogs.in-memory.repository";

export const postTestManager = {
    async createPost(data: any, expectedStatusCode: number, auth: string) {
        const response = await req
            .post(SETTINGS.PATH.POSTS)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdPost: PostViewModel = response.body;
            expect(createdPost).toEqual({
                id: expect.any(String),
                title: data.title,
                shortDescription: data.shortDescription,
                content: data.content,
                blogId: data.blogId,
                blogName: (await blogsRepository.findBlogById(data.blogId))?.name || '',
                createdAt: expect.any(String),
            });

            expect(isNaN(new Date(createdPost.createdAt).getTime())).toBe(false);

            await req
                .get(SETTINGS.PATH.POSTS + '/' + createdPost.id)
                .expect(HTTP_STATUSES.OK_200, createdPost);
        }

        return response;
    },
    async updatePost(postId: string, data: any, expectedStatusCode: number, auth: string) {
        const getPostResponse = await req
            .get(SETTINGS.PATH.POSTS + '/' + postId);

        const response = await req
            .put(SETTINGS.PATH.POSTS + '/' + postId)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.NO_CONTENT_204) {
            const postBeforeUpdate: PostViewModel = getPostResponse.body;

            const getUpdatedPostResponse = await req
                .get(SETTINGS.PATH.POSTS + '/' + postId)
                .expect(HTTP_STATUSES.OK_200);
            const updatedPost: PostViewModel = getUpdatedPostResponse.body;

            expect(updatedPost).toEqual({
                id: postBeforeUpdate.id,
                title: data.title,
                shortDescription: data.shortDescription,
                content: data.content,
                blogId: data.blogId,
                blogName: (await blogsRepository.findBlogById(data.blogId))?.name || '',
                createdAt: postBeforeUpdate.createdAt,
            });
        }

        return response;
    },
};