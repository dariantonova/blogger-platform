import {RequestWithQuery, SortDirections} from "../types";
import {QueryBlogsModel} from "../features/blogs/models/QueryBlogsModel";
import {QueryPostsModel} from "../features/posts/models/QueryPostsModel";

export const DEFAULT_QUERY_VALUES = {
    BLOGS: {
        searchNameTerm: null,
        sortBy: 'createdAt',
        sortDirection: SortDirections.DESC,
        pageSize: 10,
        pageNumber: 1,
    },
    POSTS: {
        sortBy: 'createdAt',
        sortDirection: SortDirections.DESC,
        pageSize: 10,
        pageNumber: 1,
    },
};

export const getBlogsQueryParamsValues = (req: RequestWithQuery<QueryBlogsModel>) => {
    const searchNameTerm = req.query.searchNameTerm || DEFAULT_QUERY_VALUES.BLOGS.searchNameTerm;

    const sortBy = req.query.sortBy || DEFAULT_QUERY_VALUES.BLOGS.sortBy;
    const sortDirection =
        req.query.sortDirection && req.query.sortDirection === SortDirections.ASC
            ? SortDirections.ASC
            : SortDirections.DESC;

    const pageSize = req.query.pageSize ? +req.query.pageSize : DEFAULT_QUERY_VALUES.BLOGS.pageSize;
    const pageNumber = req.query.pageNumber ? +req.query.pageNumber : DEFAULT_QUERY_VALUES.BLOGS.pageNumber;

    return {
        searchNameTerm,
        sortBy,
        sortDirection,
        pageSize,
        pageNumber
    };
};

export const getPostsQueryParamsValues = (req: RequestWithQuery<QueryPostsModel>) => {
    const sortBy = req.query.sortBy || DEFAULT_QUERY_VALUES.POSTS.sortBy;
    const sortDirection =
        req.query.sortDirection && req.query.sortDirection === SortDirections.ASC
            ? SortDirections.ASC
            : SortDirections.DESC;

    const pageSize = req.query.pageSize ? +req.query.pageSize : DEFAULT_QUERY_VALUES.POSTS.pageSize;
    const pageNumber = req.query.pageNumber ? +req.query.pageNumber : DEFAULT_QUERY_VALUES.POSTS.pageNumber;

    return {
        sortBy,
        sortDirection,
        pageSize,
        pageNumber
    };
};