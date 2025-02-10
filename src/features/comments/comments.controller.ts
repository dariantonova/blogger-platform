import {RequestWithParams, RequestWithParamsAndBody} from "../../types/types";
import {CommentViewModel, UpdateCommentInputModel, URIParamsCommentIdModel} from "./comments.types";
import {Response} from 'express';
import {CommentsQueryRepository} from "./comments.query.repository";
import {HTTP_STATUSES} from "../../utils";
import {CommentsService} from "./comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";

class CommentsController {
    private commentsService: CommentsService;
    private commentsQueryRepository: CommentsQueryRepository;
    constructor() {
        this.commentsService = new CommentsService();
        this.commentsQueryRepository = new CommentsQueryRepository();
    }

    async getComment (req: RequestWithParams<URIParamsCommentIdModel>,
                      res: Response<CommentViewModel>){
        const foundComment = await this.commentsQueryRepository.findCommentById(req.params.id);
        if (!foundComment) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundComment);
    };
    async deleteComment (req: RequestWithParams<URIParamsCommentIdModel>, res: Response) {
        const result = await this.commentsService.deleteComment(req.params.id, req.user!.id);

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async updateComment (req: RequestWithParamsAndBody<URIParamsCommentIdModel, UpdateCommentInputModel>,
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
}

export const commentsController = new CommentsController();