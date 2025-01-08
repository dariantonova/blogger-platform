import {Paginator, PostDBType, SortDirections} from "../../../types";
import {postsCollection} from "../../../db/db";
import {PostViewModel} from "../models/PostViewModel";

const createPostsPaginator = async (items: PostDBType[], page: number, pageSize: number,
                                    pagesCount: number, totalCount: number): Promise<Paginator<PostViewModel>> => {
    const itemsViewModels: PostViewModel[] = await Promise.all(
        items.map(postsQueryRepository._mapToOutput)
    );

    return {
        pagesCount,
        page,
        pageSize,
        totalCount,
        items: itemsViewModels,
    };
};

export const postsQueryRepository = {
    async findPosts(sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number): Promise<Paginator<PostViewModel>> {
        const filterObj: any = { isDeleted: false };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        const foundPosts = await postsCollection
            .find(filterObj, { projection: { _id: 0 } })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray() as PostDBType[];
        const totalCount = await postsQueryRepository.countPosts();
        const pagesCount = Math.ceil(totalCount / pageSize);

        return createPostsPaginator(foundPosts, pageNumber, pageSize, pagesCount, totalCount);
    },
    async findPostById(id: string): Promise<PostViewModel | null> {
        const foundPost = await postsCollection
            .findOne({ isDeleted: false, id: id }, { projection: { _id: 0 } });
        if (!foundPost) {
            return null;
        }

        return this._mapToOutput(foundPost);
    },
    async countPosts(): Promise<number> {
        const filterObj: any = { isDeleted: false };
        return postsCollection.countDocuments(filterObj);
    },
    async findPostsByBlogId(blogId: string,
                            sortBy: string, sortDirection: SortDirections,
                            pageNumber: number, pageSize: number): Promise<PostDBType[]> {
        const filterObj: any = { isDeleted: false, blogId: blogId };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        return await postsCollection
            .find(filterObj, { projection: { _id: 0 } })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray() as PostDBType[];
    },
    async countPostsOfBlog(blogId: string): Promise<number> {
        const filterObj: any = { isDeleted: false, blogId: blogId };
        return postsCollection.countDocuments(filterObj);
    },
    async _mapToOutput(dbPost: PostDBType): Promise<PostViewModel> {
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
};