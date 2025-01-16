import {RequestWithParams, RequestWithParamsAndBody} from "../../types/types";
import {CommentViewModel, UpdateCommentInputModel, URIParamsCommentIdModel} from "./comments.types";
import {Response} from 'express';
import {commentsQueryRepository} from "./comments.query.repository";
import {HTTP_STATUSES} from "../../utils";
import {commentsService} from "./comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";

export const commentsController = {
    getComment: async (req: RequestWithParams<URIParamsCommentIdModel>,
                       res: Response<CommentViewModel>)=> {
        const foundComment = await commentsQueryRepository.findCommentById(req.params.id);
        if (!foundComment) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundComment);
    },
    deleteComment: async (req: RequestWithParams<URIParamsCommentIdModel>, res: Response) => {
        const result = await commentsService.deleteComment(req.params.id, req.user!.id);

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    updateComment: async (req: RequestWithParamsAndBody<URIParamsCommentIdModel, UpdateCommentInputModel>,
                          res: Response) => {
        const result = await commentsService.updateComment(
            req.params.id, req.user!.id, req.body.content
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};