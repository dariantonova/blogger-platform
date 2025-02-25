import {LikeStatus, LikeStatusEnum, Paginator, PostDBType, SortDirections} from "../../../types/types";
import {PostModel} from "../../../db/db";
import {PostViewModel} from "../models/PostViewModel";
import {inject, injectable} from "inversify";
import {ExtendedLikesInfoViewModel, LikeDetails, LikeDetailsViewModel} from "../../likes/likes.types";
import {LikesRepository} from "../../likes/likes.repository";

@injectable()
export class PostsQueryRepository {
    constructor(
        @inject(LikesRepository) protected likesRepository: LikesRepository
    ) {}

    async findPosts(sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number, userId: string | null): Promise<Paginator<PostViewModel>> {
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

        return this.createPostsPaginator(foundPosts, pageNumber, pageSize, pagesCount, totalCount, userId);
    };
    async findPostById(id: string, userId: string | null): Promise<PostViewModel | null> {
        const foundPost = await PostModel
            .findOne({ isDeleted: false, id }, { _id: 0 }).lean();
        if (!foundPost) {
            return null;
        }

        return this.mapToOutput(foundPost, userId);
    };
    async countPosts(): Promise<number> {
        const filterObj: any = { isDeleted: false };
        return PostModel.countDocuments(filterObj);
    };
    async countBlogPosts(blogId: string): Promise<number> {
        const filterObj: any = { isDeleted: false, blogId };
        return PostModel.countDocuments(filterObj);
    };
    async mapToOutput(dbPost: PostDBType, userId: string | null): Promise<PostViewModel> {
        const postId = dbPost.id
        const myStatus = userId === null ? LikeStatusEnum.none
            : await this._getUserPostLikeStatus(userId, postId);
        const newestLikes: LikeDetailsViewModel[] = dbPost.extendedLikesInfo.newestLikes
            .map(this._mapLikeDetailsToOutput);

        const extendedLikesInfo: ExtendedLikesInfoViewModel = {
            likesCount: dbPost.extendedLikesInfo.likesCount,
            dislikesCount: dbPost.extendedLikesInfo.dislikesCount,
            myStatus,
            newestLikes,
        };

        return new PostViewModel(
            postId,
            dbPost.title,
            dbPost.shortDescription,
            dbPost.content,
            dbPost.blogId,
            dbPost.blogName,
            dbPost.createdAt,
            extendedLikesInfo
        );
    };
    async _getUserPostLikeStatus(userId: string, postId: string): Promise<LikeStatus>  {
        const postLike = await this.likesRepository
            .findLikeByUserAndParent(userId, postId);
        return postLike ? postLike.status : LikeStatusEnum.none;
    };
    _mapLikeDetailsToOutput(likeDetails: LikeDetails): LikeDetailsViewModel {
        return {
            addedAt: likeDetails.addedAt,
            userId: likeDetails.userId,
            login: likeDetails.login,
        };
    };
    async createPostsPaginator(items: PostDBType[], page: number, pageSize: number,
                               pagesCount: number, totalCount: number, userId: string | null): Promise<Paginator<PostViewModel>> {
        const itemsViewModels: PostViewModel[] = await Promise.all(
            items.map(item => this.mapToOutput(item, userId))
        );

        return new Paginator<PostViewModel>(
            itemsViewModels,
            pagesCount,
            page,
            pageSize,
            totalCount
        );
    };
}