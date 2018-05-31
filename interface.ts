// DB스키마와 인터페이스를 같은거로 혼동하지 맙시다요.

export class UserInfo {
    id?: string;
    password?: string;
    grade?: number;
    nickName?: string;
    profileImgUrl?: string;
    totalThumbUp?: number;
    signature?: string;
    createdTime?: Date;
    updatedTime?: Date;

    constructor() {}

}

export interface DocumentInfo {
    _id?: string;
    title?: string;
    text?: string;
    createdTime?: Date;
    modifiedTime?: Date;
    relatedDocuId?: string;
    // thumbUp?: string[];
    userInfo?: UserInfo;
    tagList?: string[];
    libraryList?: Library[];
    historyId?: string;
    private: boolean;
    
}

export interface Library {
    _id?: string;
    title?: string;
    version?: string;
    memo?: string;

}

export class Tag {
    _id?: string;
    title?: string;
    constructor(TagName?: string) {
        if (TagName !== undefined) {
            this.title = TagName;
        }
    }
}

// ---- 카테고리 인터페이스 ----
interface CategoryGrade3 {
    _id?: string;
    title?: string;
    tag?: string;
    grade?: number;
}

interface CategoryGrade2 extends CategoryGrade3 {
    subCategory?: CategoryGrade3[];
}

export interface Category extends CategoryGrade2 {
    createdTime?: Date;
    updatedTime?: Date;
    deleted?: boolean;
    deletedBy?: string;
    updatedBy?: string;
    historyId?: string;
    subCategory?: CategoryGrade2[];
}
// ---- 카테고리 인터페이스 ----

export interface Reply {
    _id?: string;
    historyId: string;
    parentId: string;
    text: string;
    userId: string;
    createdTime?: Date;
    updatedTime?: Date;
    deleted?: boolean;
    updated?: boolean;
    deletedReply?: boolean;
    rereply?: Reply[];
}

export interface pageCursor {
    cursor: number;
    countPerPage: number;
    totalCount: number;
}

export interface Result {
    result: boolean;
    msg?: string;
    code?: number;
    payload?: any;
}

export class Result implements Result{
    constructor(result: boolean, msg?: string, code?: number, payload?: any) {
        this.result = result;
        if (msg !== undefined && msg !== null)
            this.msg = msg;
        if (code !== undefined && code !== null)
            this.code = code;
        if (payload !== undefined && payload !== null)
            this.payload = payload;
    }
}