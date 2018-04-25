import * as mongoose from 'mongoose';
import { Schema, Model, Document as MongDocument } from 'mongoose';
import { DocumentInfo, Result } from '../interface';

export default class Document {
    private schema: Schema;
    private model: Model<MongDocument>;

    constructor() {
        this.schema = this.setSchema();
        this.model = mongoose.model<MongDocument>('document', this.schema);
    }

    private setSchema(): Schema {
        let library = { title: String, version: String, memo: String };

        let schema = new Schema({
            title: { type: String },
            text: { type: String },
            relatedDocuId: { type: String },
            thumbUp: { type: [String] },
            userId: String,
            tagList: [String],
            libraryList: [library],
            historyId: { type: String, default: '' },
            createdTime: { type: Date, default: Date.now },
            modifiedTime: { type: Date, default: Date.now },
            deleted: { type: Boolean, default: false }
        });
        return schema;
    }

    // 새로운 문서 입력.
    public async insertNewDocument(document: DocumentInfo) {
        let doc: MongDocument = new this.model(document);
        let result = await doc.save().catch(err => -1);

        if (result === -1) return { result: false, msg: '알 수 없는 오류로 생성 실패에요.' };
        return { result: true, payload: result, msg: '문서 생성 성공.' };
    }

    // 문서 한개를 검색.
    public async getDocumentOne(id: string) {
        let result = await this.model.findOne({ _id: id, deleted: false }, { deleted: false })
        .catch(err => null);

        if (result === null)
            return new Result(false, '해당 문서가 없거나, 검색에 실패했어요.');

        return new Result(true, '검색 성공', 0, result);
    }

    public async getDocumens() {
        // TODO 만들어야 해요. 아마도.. 태그랑 검색어를 받아서 검색해야 할 듯 한데?
    }

    // 특정 유저가 작성한 문서들의 id만 리턴.
    public async searchUserDocumentIds(userId: string) {
        let findResult = await this.model.find({ userId: userId, deleted: false }, { _id: true });
        return new Result(true, '검색 성공', 0, findResult);
    }

    // 문서 수정.
    public async modifyDocument(document: DocumentInfo, userId: string) {
        let findResult = await this.model.findOne({ _id: document._id, deleted: false })
        .catch(err => null);

        if (findResult === null)
            return new Result(false, '해당 문서가 존재하지 않아요.');
        
        if (JSON.parse(JSON.stringify(findResult))['userId'] !== userId)
            return new Result(false, '해당 사용자는 문서 작성자가 아니에요.');

        let updateResult = await this.model.updateOne(
            { _id: document._id }, { $set: { deleted: true } })
        .catch(err => null);

        console.log('After Running updateOne function, the result is ');
        console.log(updateResult);
        if (updateResult === null || updateResult < 1)
            return new Result(false, '문서 정보 업데이트에 실패 했어요.');

        // 문서 수정이니까 히스토리 아이디를 채워 넣어 줍시다.
        if (document.historyId === undefined ||
            document.historyId === null ||
            document.historyId === '') {
            document.historyId = document._id;
        }

        delete document._id; // 새로운 문서로 입력하기 위해서 _id는 삭제.
        return await this.insertNewDocument(document).then(checkInsertResult);


        // ---- 정리용도 함수 모음집 ----
        function checkInsertResult(value: Result) {
            if (value.result === true)
                return new Result(true, '문서 업데이트에 성공했어요.', 0, value.payload);
            else
                return new Result(false, value.msg);
        }

    }

    public async removeDocument(document: DocumentInfo, userId: string) {
        let findResult = await this.model.findOne({ _id: document._id, deleted: false })
        .catch(err => null);

        if (findResult === null)
            return new Result(false, '해당 문서가 존재하지 않거나, 검색에 실패 했어요.');

        if (JSON.parse(JSON.stringify(findResult))['userId'] !== userId)
            return new Result(false, '해당 사용자는 문서 작성자가 아니에요.');

        let updateResult = await this.model.updateOne(
            { _id: document._id }, { $set: { deleted: true } })
        .catch(err => null);

        if (updateResult === null || updateResult < 1)
            return new Result(false, '문서 업데이트 실패했어요..');

        return new Result(true, '문서 삭제 완료했어요.', 0, updateResult);
    }

    public async setTag(documentId: string, userId: string,  tag: string) {
        // 문서를 찾아서, 있으면 태그만 삽입하면 될 것 같지만.. 중복 검사도 해야 하나..
        let result = await this.model.findOne({ _id: documentId, deleted: false })
            .catch(err => null);

        if (result === null)
            return new Result(false, '해당 문서가 존재하지 않거나, 검색에 실패 했어요.');

        const doc = JSON.parse(JSON.stringify(result));

        // 태그 입력자가 문서 작성자인지 검사.
        if (doc['userId'] !== userId)
            return new Result(false, '해당 사용자는 문서 작성자가 아닙니다.');

        // TagList 중복 검사
        let tagList: string[] = doc['tagList'];
        if (tagList.find(compareTag) !== undefined)
            return new Result(false, '문서에 중복되는 태그가 이미 존재합니다.');

        tagList.push(tag);

        result = await this.model.updateOne({ _id: documentId }, { $set: { tagList: tagList } })
        .catch(value => null);

        if (result === null || result === undefined)
            return new Result(false, '문서에 태그를 입력하는 도중에 오류가 발생했어요..');

        return new Result(true, '태그 입력 완료', 0, result);

        // ---- 정리용도 함수 모음 ----
        function compareTag(value: string): boolean {
            return value.toLocaleLowerCase() === tag.toLocaleLowerCase() ? true : false;
        }
    }

    public async removeTag(documentId: string, userId: string, tag: string) {
        let findResult = await this.model.findOne({ _id: documentId, deleted: false })
        .catch(err => null);

        if (findResult === null)
            return new Result(false, '해당 문서가 존재하지 않거나, 검색에 실패 했어요.');

        let doc = JSON.parse(JSON.stringify(findResult));

        if (doc['userId'] !== userId)
            return new Result(false, '해당 사용자는 문서 작성자가 아닙니다.');

        // 해당 태그 삭제.
        let tagList: string[] = doc['tagList'];
        tagList = tagList.filter(filteringTag);

        let updateResult = await this.model.updateOne(
            { _id: documentId }, { $set: { tagList: tagList } })
        .catch(err => null);

        if (updateResult === null || updateResult === undefined)
            return new Result(false, '태그를 제거 하는데 실패했어요.');

        return new Result(true, '태그 삭제 완료.', 0, updateResult);

        // ---- 정리용도 함수 모음 ----
        function filteringTag(value: string): boolean {
            return value.toLocaleLowerCase() === tag.toLocaleLowerCase() ?
                false : true;
        }
    }

    public async searchDocuments(lang: string, type: number, subj: string) {
        const TYPE_SUBJECT = 0;
        const TYPE_USER_ID = 1;
        const TYPE_USER_NICKNAME = 2;
        const TYPE_TAG = 3;

        let condition;
        if (lang === 'category-all') 
            condition = { deleted: false };
        else 
            condition = { tagList: lang.toLocaleLowerCase(), deleted: false };

        switch (type) {
            case TYPE_SUBJECT :
                condition = Object.assign({}, condition, { title: { $regex: subj } });
                break;
            
            case TYPE_USER_ID :
                condition = Object.assign({}, condition, { userId: { $regex: subj } });
                break;

            case TYPE_TAG:
                condition = Object.assign({}, condition, { tagList: subj });
                break;

            case TYPE_USER_NICKNAME :
                // 일단 미 지원.
                // 닉네임으로 유저를 검색해서, 해당 유저의 id를 알아내서 id로 검색을 해야 할 듯.
                break;

            default:
                break;
        }

        const result = await this.model.find(condition, { deleted: false });
        if (result.length < 1)
            return new Result(false, '검색 결과가 없어요.');

        return new Result(true, '검색 완료', 0, result);
    }
}