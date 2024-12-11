import {Request, Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {postsRepository} from "./posts.repository";
import {PostDBType, RequestWithBody, RequestWithParams} from "../../types";
import {blogsRepository} from "../blogs/blogs.repository";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";

export const mapPostToViewModel = (dbPost: PostDBType): PostViewModel => {
    const blogName = blogsRepository.findBlogById(dbPost.blogId)?.name || '';

    return {
        id: dbPost.id,
        title: dbPost.title,
        shortDescription: dbPost.shortDescription,
        content: dbPost.content,
        blogId: dbPost.blogId,
        blogName,
    };
};

export const postsController = {
    getPosts: (req: Request, res: Response<PostViewModel[]>) => {
        const foundPosts = postsRepository.findPosts();

        res.json(foundPosts.map(mapPostToViewModel));
    },
    getPost: (req: RequestWithParams<URIParamsPostIdModel>, res: Response<PostViewModel>) => {
        const foundPost = postsRepository.findPostById(req.params.id);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(mapPostToViewModel(foundPost));
    },
    deletePost: (req: RequestWithParams<URIParamsPostIdModel>, res: Response) => {
        const isDeleted = postsRepository.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createPost: (req: RequestWithBody<CreatePostInputModel>,
                 res: Response<PostViewModel>) => {
        const createdPost = postsRepository.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(mapPostToViewModel(createdPost));
    },
};