import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {HTTP_STATUSES} from "../src/utils";
import {BlogViewModel} from "../src/features/blogs/models/BlogViewModel";

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
            });

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + createdBlog.id)
                .expect(HTTP_STATUSES.OK_200, createdBlog);
        }

        return response;
    },
};