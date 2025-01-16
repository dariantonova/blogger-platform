import {RequestWithParams} from "../../types/types";
import {CommentViewModel, URIParamsCommentIdModel} from "./comments.types";
import {Response} from 'express';
import {commentsQueryRepository} from "./comments.query.repository";
import {HTTP_STATUSES} from "../../utils";

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
};