import {BlogDBType, Paginator, SortDirections} from "../../../types";
import {blogsCollection} from "../../../db/db";
import {BlogViewModel} from "../models/BlogViewModel";

export const blogsQueryRepository = {
    async findBlogs(searchNameTerm: string | null,
                    sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number): Promise<Paginator<BlogViewModel>> {
        const filterObj: any = { isDeleted: false };

        if (searchNameTerm) {
            filterObj.name = { $regex: searchNameTerm, $options: 'i' };
        }

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        const foundBlogs = await blogsCollection
            .find(filterObj, { projection: { _id: 0 } })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray() as BlogDBType[];
        const totalCount = await this.countBlogs(searchNameTerm);
        const pagesCount = Math.ceil(totalCount / pageSize);

        return this.createBlogsPaginator(foundBlogs, pageNumber, pageSize, pagesCount, totalCount);
    },
    async findBlogById(id: string): Promise<BlogViewModel | null> {
        const foundBlog = await blogsCollection
            .findOne({ isDeleted: false, id: id }, { projection: { _id: 0 } });
        if (!foundBlog) {
            return null;
        }

        return this.mapToOutput(foundBlog);
    },
    async countBlogs(searchNameTerm: string | null): Promise<number> {
        const filterObj: any = { isDeleted: false };

        if (searchNameTerm) {
            filterObj.name = { $regex: searchNameTerm, $options: 'i' };
        }

        return blogsCollection.countDocuments(filterObj);
    },
    mapToOutput(dbBlog: BlogDBType): BlogViewModel {
        return {
            id: dbBlog.id,
            name: dbBlog.name,
            description: dbBlog.description,
            websiteUrl: dbBlog.websiteUrl,
            createdAt: dbBlog.createdAt,
            isMembership: dbBlog.isMembership,
        };
    },
    createBlogsPaginator (items: BlogDBType[], page: number, pageSize: number,
           pagesCount: number, totalCount: number): Paginator<BlogViewModel> {
        const itemsViewModels: BlogViewModel[] = items.map(this.mapToOutput);

        return {
            pagesCount,
            page,
            pageSize,
            totalCount,
            items: itemsViewModels,
        };
    },
};