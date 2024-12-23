import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    PostDBType,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody,
    RequestWithQuery,
    SortDirections
} from "../../types";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";
import {UpdatePostInputModel} from "./models/UpdatePostInputModel";
import {postsService} from "./posts.service";
import {blogsService} from "../blogs/blogs.service";
import {QueryPostsModel} from "./models/QueryPostsModel";

export const mapPostToViewModel = async (dbPost: PostDBType): Promise<PostViewModel> => {
    const blog = await blogsService.findBlogById(dbPost.blogId);
    const blogName = blog?.name || '';

    return {
        id: dbPost.id,
        title: dbPost.title,
        shortDescription: dbPost.shortDescription,
        content: dbPost.content,
        blogId: dbPost.blogId,
        blogName,
        createdAt: dbPost.createdAt,
    };
};

export const postsController = {
    getPosts: async (req: RequestWithQuery<QueryPostsModel>, res: Response<PostViewModel[]>) => {
        const sortBy = req.query.sortBy || 'createdAt';
        const sortDirection = req.query.sortDirection
            && Object.values<string>(SortDirections).includes(req.query.sortDirection)
            ? req.query.sortDirection : SortDirections.DESC;

        const foundPosts = await postsService.findPosts(sortBy, sortDirection);

        const postsToSend = await Promise.all(foundPosts.map(mapPostToViewModel));
        res.json(postsToSend);
    },
    getPost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response<PostViewModel>) => {
        const foundPost = await postsService.findPostById(req.params.id);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const postToSend = await mapPostToViewModel(foundPost);
        res.json(postToSend);
    },
    deletePost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response) => {
        const isDeleted = await postsService.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createPost: async (req: RequestWithBody<CreatePostInputModel>,
                 res: Response<PostViewModel>) => {
        const createdPost = await postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        const postToSend = await mapPostToViewModel(createdPost);
        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(postToSend);
    },
    updatePost: async (req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
                 res: Response) => {
        const isUpdated = await postsService.updatePost(
            req.params.id, req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        if (!isUpdated) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};