import {Request, Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {postsRepository} from "./posts.db.repository";
import {PostDBType, RequestWithBody, RequestWithParams, RequestWithParamsAndBody} from "../../types";
import {blogsRepository} from "../blogs/blogs.db.repository";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";
import {UpdatePostInputModel} from "./models/UpdatePostInputModel";

export const mapPostToViewModel = async (dbPost: PostDBType): Promise<PostViewModel> => {
    const blog = await blogsRepository.findBlogById(dbPost.blogId);
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
    getPosts: async (req: Request, res: Response<PostViewModel[]>) => {
        const foundPosts = await postsRepository.findPosts();

        const postsToSend = await Promise.all(foundPosts.map(mapPostToViewModel));
        res.json(postsToSend);
    },
    getPost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response<PostViewModel>) => {
        const foundPost = await postsRepository.findPostById(req.params.id);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const postToSend = await mapPostToViewModel(foundPost);
        res.json(postToSend);
    },
    deletePost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response) => {
        const isDeleted = await postsRepository.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createPost: async (req: RequestWithBody<CreatePostInputModel>,
                 res: Response<PostViewModel>) => {
        const createdPost = await postsRepository.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        const postToSend = await mapPostToViewModel(createdPost);
        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(postToSend);
    },
    updatePost: async (req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
                 res: Response) => {
        const isUpdated = await postsRepository.updatePost(
            req.params.id, req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        if (!isUpdated) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};