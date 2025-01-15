import {ResultStatus} from "./resultStatus";

export type Result<TData> = {
    status: ResultStatus,
    data: TData,
};