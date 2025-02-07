import {Paginator, PostDBType, SortDirections} from "../../../types/types";
import {PostModel} from "../../../db/db";
import {PostViewModel} from "../models/PostViewModel";

export const postsQueryRepository = {
    async findPosts(sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number): Promise<Paginator<PostViewModel>> {
        const filterObj: any = { isDeleted: false };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        const foundPosts = await PostModel
            .find(filterObj, { _id: 0 })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();
        const totalCount = await this.countPosts();
        const pagesCount = Math.ceil(totalCount / pageSize);

        return this.createPostsPaginator(foundPosts, pageNumber, pageSize, pagesCount, totalCount);
    },
    async findPostById(id: string): Promise<PostViewModel | null> {
        const foundPost = await PostModel
            .findOne({ isDeleted: false, id }, { _id: 0 }).lean();
        if (!foundPost) {
            return null;
        }

        return this.mapToOutput(foundPost);
    },
    async countPosts(): Promise<number> {
        const filterObj: any = { isDeleted: false };
        return PostModel.countDocuments(filterObj);
    },
    async countBlogPosts(blogId: string): Promise<number> {
        const filterObj: any = { isDeleted: false, blogId };
        return PostModel.countDocuments(filterObj);
    },
    async mapToOutput(dbPost: PostDBType): Promise<PostViewModel> {
        return {
            id: dbPost.id,
            title: dbPost.title,
            shortDescription: dbPost.shortDescription,
            content: dbPost.content,
            blogId: dbPost.blogId,
            blogName: dbPost.blogName,
            createdAt: dbPost.createdAt,
        };
    },
    async createPostsPaginator(items: PostDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Promise<Paginator<PostViewModel>> {
        const itemsViewModels: PostViewModel[] = await Promise.all(
            items.map(this.mapToOutput)
        );

        return {
            pagesCount,
            page,
            pageSize,
            totalCount,
            items: itemsViewModels,
        };
    },
};