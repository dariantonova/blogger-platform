import { param } from "express-validator";

export const idUriParamValidator = param('id')
    .isMongoId().withMessage('Id must be a mongo id');