import * as mongoose from 'mongoose';
import { Document, Schema, Model } from 'mongoose';
import { Util } from './Mongo';
import { Result } from '../interface';

export default class ThumbUp {
    private schema: Schema;
    private model: Model<Document>;

    constructor() {
        this.schema = this.setSchema();
        this.model = mongoose.model<Document>('thumbup', this.schema);
    }

    setSchema() {
        const schema = new Schema(
            {
                documentId: { type: String },
                userList: { type: [
                        {
                            userId: { type: String },
                            createdTime: { type: Date, default: Date.now }
                        }
                    ] 
                },
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

    // 엄지척 추가요.
    public async insertThumbUp(docuId: string, userId: string) {
        // ---- 정리용도 함수 모음 -----------------------------------
        const InsertNewThumbUp = async () => {
            const doc = new this.model(
                {
                    documentId: docuId,
                    userList: { userId: userId }
                }
            );

            const docResult:any = await doc.save()
                .catch(err => { console.error(err); return null; });

            if (docResult === null)
                return new Result(false, '새로운 엄지척을 만들면서 문제가 발생했어요.');

            return new Result(true, '엄지척 생성 완료.', 0, docResult.userList.length);
        }

        const UpdateThumbUp = async () => {
            const updateResult: any = await this.model.findOneAndUpdate(
                { documentId: docuId },
                { $addToSet: { userList: { userId: userId, createdTime: Date.now() } } },
                { new: true })
                .catch(err => { console.error(err); return null; });

            if (updateResult === null)
                return new Result(false, '엄지척을 넣으면서 문제가 발생했어요.');
            console.log(updateResult);
            return new Result(true, '엄지척 삽입 완료.', 0, updateResult.userList.length);
        }
        // ---- 정리용도 함수 모음 끝 -------------------------------

        const count: any = await this.model.count({ documentId: docuId })
            .catch(err => { console.error(err); return null; });

        if (count === null)
            return new Result(false, '해당 엄지척을 찾는 도중 문제가 발생했어요.');

        if (count === 0) {
            // 기존 엄지척이 없으면, 새로 만들죠.
            return await InsertNewThumbUp()
                .then(newResult => newResult);
        } else {
            // 기존 엄지척이 있으면, 업데이트를 하죠.
            return await UpdateThumbUp()
                .then(updateResult => updateResult);
        }
    }
    
}