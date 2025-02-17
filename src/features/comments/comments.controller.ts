import {RequestWithParams, RequestWithParamsAndBody} from "../../types/types";
import {CommentViewModel, LikeInputModel, UpdateCommentInputModel, URIParamsCommentIdModel} from "./comments.types";
import {Response} from 'express';
import {CommentsQueryRepository} from "./comments.query.repository";
import {HTTP_STATUSES} from "../../utils";
import {CommentsService} from "./comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {inject, injectable} from "inversify";
import {CommentLikesService} from "./comment-likes/comment-likes.service";

@injectable()
export class CommentsController {
    constructor(
        @inject(CommentsService) protected commentsService: CommentsService,
        @inject(CommentsQueryRepository) protected commentsQueryRepository: CommentsQueryRepository,
        @inject(CommentLikesService) protected commentLikesService: CommentLikesService
    ) {}

    async getComment(req: RequestWithParams<URIParamsCommentIdModel>,
                      res: Response<CommentViewModel>){
        const userId = req.user ? req.user.id : null;
        const foundComment = await this.commentsQueryRepository
            .findCommentById(req.params.id, userId);
        if (!foundComment) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundComment);
    };
    async deleteComment(req: RequestWithParams<URIParamsCommentIdModel>, res: Response) {
        const result = await this.commentsService.deleteComment(req.params.id, req.user!.id);

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async updateComment(req: RequestWithParamsAndBody<URIParamsCommentIdModel, UpdateCommentInputModel>,
                         res: Response) {
        const result = await this.commentsService.updateComment(
            req.params.id, req.user!.id, req.body.content
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async updateCommentLikeStatus(req: RequestWithParamsAndBody<{ commentId: string }, LikeInputModel>,
                                  res: Response) {
        const commentId = req.params.commentId;
        const likeStatus = req.body.likeStatus;
        const user = req.user;

        if (!user) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        const result = await this.commentLikesService.updateCommentLikeStatus(
            commentId, user.id, likeStatus
        );
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
}