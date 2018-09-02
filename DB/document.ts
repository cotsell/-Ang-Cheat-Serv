import * as mongoose from 'mongoose';
import { Schema, Model, Document as MongDocument } from 'mongoose';
import { DocumentInfo, Result, pageCursor } from '../interface';
import * as uuid from 'uuid/v1';

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
      userId: String,
      tagList: [String],
      libraryList: [library],
      historyId: { type: String, default: uuid },
      createdTime: { type: Date, default: Date.now },
      modifiedTime: { type: Date, default: Date.now },
      deleted: { type: Boolean, default: false },
      private: { type: Boolean, default: false }
      // replyCount: { type: Number, default: 0 },
      // viewCount: { type: Number, default: 0 }
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

  // 문서 한개를 조회.
  public async getDocumentOne(docHistoryId: string, userId?: string) {

    let result: any = await this.model.findOne(
      { historyId: docHistoryId, deleted: false },
      { deleted: false })
    .catch(err => null);

    if (result === null)
      return new Result(false, '해당 문서가 없거나, 검색에 실패했어요.', 2);

    if (result.private === true) {
      if (userId === undefined) { // || result.userId !== userId)
        return new Result(false, '비공개 자료에요. (일)', 3);
      }
      if (result.userId !== userId)
        return new Result(false, '비공개 자료에요. (이)', 3);
    }
    return new Result(true, '문서 가져오기 성공.', 0, result);
  }

  // TODO 만들어야 해요. 아마도.. 태그랑 검색어를 받아서 검색해야 할 듯 한데?
  public async getDocumens() {
  }

  // TODO 수정해야 함. 지금 사용 안함. 용도 변경할 것임.
  // 특정 유저가 작성한 문서들의 id만 리턴.
  public async searchUserDocumentIds(userId: string) {
    let findResult: any = await this.model.find(
      { userId: userId, deleted: false },
      { _id: true });
    return new Result(true, '검색 성공', 0, findResult);
  }

  // 특정 유저가 작성한 문서의 총 숫자를 알려줘요.
  // private는.. 무시하고 알려줘요.
  public async getUserDocumentsCount(userId: string) {
    const result: any = await this.model.count({ userId: userId, deleted: false })
    .catch(err => { console.error(err); return null; });

    if (result === null)
      return new Result(false, '숫자를 세다가 문제가 발생했어요..');

    return new Result(true, '숫자 세기 성공.', 0, result);
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

  // 문서 삭제
  public async removeDocument(document: DocumentInfo, userId: string) {
    let findResult = await this.model.findOne(
      { _id: document._id, deleted: false })
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

  // TODO 쿼리 사용이 너무 많음.. 한번으로 해결 가능할꺼임. findOneAndUpdate로..
  // 태그 입력. 
  public async setTag(documentId: string, userId: string,  tag: string) {
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

    result = await this.model.updateOne(
      { _id: documentId }, 
      { $set: { tagList: tagList } })
    .catch(value => null);

    if (result === null || result === undefined)
      return new Result(false, '문서에 태그를 입력하는 도중에 오류가 발생했어요..');

    return new Result(true, '태그 입력 완료', 0, result);

    // ---- 정리용도 함수 모음 ----
    function compareTag(value: string): boolean {
      return value.toLocaleLowerCase() === tag.toLocaleLowerCase() ? true : false;
    }
  }

  // TODO 쿼리 사용이 너무 많음.. 한번으로 해결 가능할꺼임. findOneAndUpdate로..
  // 태그 삭제.
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

  public async searchDocuments(lang: string, type: number, subj: string, cursor: pageCursor) {
    const TYPE_SUBJECT = 0;
    const TYPE_USER_ID = 1;
    const TYPE_USER_NICKNAME = 2;
    const TYPE_TAG = 3;

    let condition;
    condition = { deleted: false, private: false };

    switch (type) {
      case TYPE_SUBJECT :
        // condition = Object.assign({}, condition, { title: { $regex: subj } });
        if (lang !== 'category-all') {
          condition = Object.assign({},
            condition,
            { title: { $regex: subj } },
            { $or: [
                { tagList: lang.toLocaleLowerCase() },
                { $and: [
                    { tagList: lang.toLocaleLowerCase() },
                    { tagList: { $regex: subj } }
                  ]
                }
              ]
            });
        } 
        else {
          condition = Object.assign({},
            condition,
            { $or: [
                { title: { $regex: subj } },
                { tagList: { $regex: subj } }
              ]}
          );
        }
        break;

      case TYPE_USER_ID :
        condition = Object.assign({}, condition, { userId: { $regex: subj } });
        break;

      case TYPE_TAG:
        // condition = Object.assign({}, condition, 
        //   { 
        //     tagList: { $regex: subj} 
        //   }
        // );
        condition = Object.assign({}, condition, 
          { 
            $and: [
              { tagList: lang.toLocaleLowerCase() },
              { tagList: { $regex: subj } }
            ]
          }
        );

        break;

      case TYPE_USER_NICKNAME :
        // 일단 미 지원.
        // 닉네임으로 유저를 검색해서, 해당 유저의 id를 알아내서 id로 검색을 해야 할 듯.
        break;

      default:
        break;
    }

    console.log(`TEST`); 
    console.log(JSON.stringify(condition));

    const result: any = await this.model.find(
      condition, 
      { deleted: false },
      { skip: (cursor.cursor - 1) * cursor.countPerPage,
        limit: cursor.countPerPage * 1 })
    .catch(err => { console.error(err); return null; });

    if (result === null || result.length < 1)
      return new Result(false, '검색 결과가 없어요.');

    const totalCount = await this.model.count(condition);

    return new Result(true, '검색 완료', 0, 
      { totalCount: totalCount, list: result });
  }
  
  // 유저가 작성한 리스트를 리턴해요.
  // cursor는 리턴받을 데이터를 기준으로 입력 받아요.
  async searchUserDocuments(docuUserId: string, privateMode: boolean, cursor: pageCursor) {
    // TODO 미작성. 작성해야 함.
    let condition = { userId: docuUserId, deleted: false };

    if (!privateMode) 
      condition = Object.assign({}, { ...condition, private: false });

    const result: any = await this.model.find(condition, null, 
      { 
        skip: (cursor.cursor - 1) * cursor.countPerPage,
        limit: cursor.countPerPage * 1
      })
    .catch(err => { console.error(err); return null; });

    if (result === null || result.length < 1)
      return new Result(false, '검색 결과가 없어요.');

    const totalCount = await this.model.count(condition);

    return new Result(true, '검색 완료', 0, 
      { totalCount: totalCount, list: result });
  }
}