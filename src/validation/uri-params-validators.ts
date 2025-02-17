import { param } from "express-validator";

export const idUriParamValidator = param('id')
    .isMongoId().withMessage('Id must be a mongo id');

export const commentIdUriParamValidator = param('commentId')
    .isMongoId().withMessage('Comment id must be a mongo id');