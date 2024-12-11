import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";
import {blogsRepository} from "../../src/features/blogs/blogs.repository";

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
                blogName: blogsRepository.findBlogById(data.blogId)?.name || '',
            });

            await req
                .get(SETTINGS.PATH.POSTS + '/' + createdPost.id)
                .expect(HTTP_STATUSES.OK_200, createdPost);
        }

        return response;
    },
};