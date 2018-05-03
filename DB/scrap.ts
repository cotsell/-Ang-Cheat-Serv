import * as mongoose from 'mongoose';
import { Document, Schema, Model } from 'mongoose';
import { Util } from './Mongo';
import { Result } from '../interface';

export default class Scrap {
  private schema: Schema;
  private model: Model<Document>;

  constructor() {
    this.schema = this.setSchema();
    this.model = mongoose.model<Document>('scrap', this.schema);
  }

  setSchema() {
    const schema = new Schema(
      {
        userId: { type: String },
        docuList: { type: [String] },
        // labelList: { type: [String] },
        // docuList: { type: [
        //     {
        //       docuId: { type: String },
        //       label: { type: String, required: true },
        //       createdTime: { type: Date, default: Date.now }
        //     }
        //   ] 
        // },
        createdTime: { type: Date, default: Date.now },
        updatedTime: { type: Date, default: Date.now }
      }
    );

    return schema;
  }

  public getSchema(): Schema {
    return this.schema;
  }

  public getModel(): Model<Document> {
    return this.model;
  }

  // 새로운 스크랩 추가.
  public async setScrap(userId: string, docuId: string) {

    const count = await this.model.count({ userId: userId });

    // 기존 데이터가 없으면 새로 생성.
    if (count === 0) {
      const doc = new this.model(
        {
          userId: userId,
          docuList: [docuId],
        }
      );
      const docResult = await doc.save().catch(err => { console.error(err); return null; });

      if (docResult === null)
        return new Result(false, '새로운 스크랩을 만드는 과정에 문제가 발생했어요.');
      
      return new Result(true, '스크랩 생성 성공했어요.', 0, docResult);
    } else {

      // 기존 데이터가 있어서, 수정.
      const result: any = await this.model.findOneAndUpdate(
        { userId: userId },
        { $set: { userId: userId, updatedTime: Date.now() }, 
          $addToSet: { docuList: docuId }}, // 얘가 중복 체크도 해줘요.
        { new: true })
        .catch(err => { console.error(err); return null; });
  
      if (result === null)
        return new Result(false, '스크랩을 시도 하고 있는 도중에 문제가 발생했어요.');
  
      // console.log(`스크랩 추가 처리 결과는..`);
      // console.log(result);
      return new Result(true, '', 0, result);
    }
  }

  // 스크랩 가져오기
  public async getScrap(userId: string) {
    const result: any = await this.model.findOne({ userId: userId })
      .catch(err => { console.error(err); return null; });

    if (result === null)
      return new Result(false, '해당 스크랩 리스트가 없거나, 검색에 실패했어요..');

    return new Result(true, '스크랩 가져오기 성공.', 0, result.docuList);
  }

}