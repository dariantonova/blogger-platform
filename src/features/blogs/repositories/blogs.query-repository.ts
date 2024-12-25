import {BlogDBType, SortDirections} from "../../../types";
import {blogsCollection} from "../../../db/db";
import {BlogViewModel} from "../models/BlogViewModel";

export const blogsQueryRepository = {
    async findBlogs(searchNameTerm: string | null,
                    sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number): Promise<BlogDBType[]> {
        // filter
        const filterObj: any = { isDeleted: false };

        if (searchNameTerm) {
            filterObj.name = { $regex: searchNameTerm, $options: 'i' };
        }

        // sorting
        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        return await blogsCollection
            .find(filterObj, { projection: { _id: 0 } })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray() as BlogDBType[];
    },
    async findBlogById(id: string): Promise<BlogDBType | null> {
        return blogsCollection.findOne({ isDeleted: false, id: id }, { projection: { _id: 0 } });
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
    }
};