import {BlogDBType, Paginator, SortDirections} from "../../../types/types";
import {BlogModel} from "../../../db/db";
import {BlogViewModel} from "../models/BlogViewModel";

export class BlogsQueryRepository {
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

        const foundBlogs = await BlogModel
            .find(filterObj, { _id: 0 })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();
        const totalCount = await this.countBlogs(searchNameTerm);
        const pagesCount = Math.ceil(totalCount / pageSize);

        return this.createBlogsPaginator(foundBlogs, pageNumber, pageSize, pagesCount, totalCount);
    };
    async findBlogById(id: string): Promise<BlogViewModel | null> {
        const foundBlog = await BlogModel
            .findOne({ isDeleted: false, id }, { _id: 0 }).lean();
        if (!foundBlog) {
            return null;
        }

        return this.mapToOutput(foundBlog);
    };
    async countBlogs(searchNameTerm: string | null): Promise<number> {
        const filterObj: any = { isDeleted: false };

        if (searchNameTerm) {
            filterObj.name = { $regex: searchNameTerm, $options: 'i' };
        }

        return BlogModel.countDocuments(filterObj);
    };
    mapToOutput(dbBlog: BlogDBType): BlogViewModel {
        return new BlogViewModel(
            dbBlog.id,
            dbBlog.name,
            dbBlog.description,
            dbBlog.websiteUrl,
            dbBlog.createdAt,
            dbBlog.isMembership
        );
    };
    createBlogsPaginator (items: BlogDBType[], page: number, pageSize: number,
                          pagesCount: number, totalCount: number): Paginator<BlogViewModel> {
        const itemsViewModels: BlogViewModel[] = items.map(this.mapToOutput);

        return new Paginator<BlogViewModel>(
            itemsViewModels,
            pagesCount,
            page,
            pageSize,
            totalCount
        );
    };
}