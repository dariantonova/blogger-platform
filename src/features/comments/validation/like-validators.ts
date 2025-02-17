import {body} from "express-validator";
import {LikeStatusEnum} from "../../../types/types";

export const likeStatusValidator = body('likeStatus')
    .custom((value) => {
        return Object.values(LikeStatusEnum).includes(value);
    }).withMessage('Like status must be one of the following: ' + Object.values(LikeStatusEnum));