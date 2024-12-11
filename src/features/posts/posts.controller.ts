import {Request, Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {postsRepository} from "./posts.repository";
import {PostDBType} from "../../types";
import {blogsRepository} from "../blogs/blogs.repository";

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
};