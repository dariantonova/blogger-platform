import {body} from "express-validator";
import {LikeStatus} from "../../../types/types";

export const likeStatusValidator = body('likeStatus')
    .custom((value) => {
        return Object.values(LikeStatus).includes(value);
    }).withMessage('Like status must be one of the following: ' + Object.values(LikeStatus));