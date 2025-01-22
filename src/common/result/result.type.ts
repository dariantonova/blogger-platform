import {ResultStatus} from "./resultStatus";

type ExtensionType = {
    field: string | null,
    message: string | null,
};

export type Result<TData> = {
    status: ResultStatus,
    data: TData,
    extensions: ExtensionType[],
};