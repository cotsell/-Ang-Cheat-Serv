import * as mongoose from 'mongoose';
import { Document, Schema, Model } from 'mongoose';
import { Util } from './Mongo';
import { Result } from '../interface';

interface UserList {
    userId: string,
    createdTime: Date
}


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

        const count: any = await this.model.findOne({ documentId: docuId })
            .catch(err => { console.error(err); return -1; });

        if (count === -1)
            return new Result(false, '해당 엄지척을 찾는 도중 문제가 발생했어요.');

        if (count === null) {
            // 기존 엄지척이 없으면, 새로 만들죠.
            return await InsertNewThumbUp()
                .then(newResult => newResult);
        }

        // 중복 처리 할 꺼임.
        // userList가 비었거나, 중복되는 엄지척이 없으면, undefined를 리턴.
        let hasIt: any = undefined;
        if (count.userList !== undefined && count.userList.length > 0) {
             hasIt = count.userList.find((filter: UserList) => {
                return filter.userId === userId ? true : false;
            });
        }

        if (hasIt === undefined) {
            // 기존 엄지척이 있으면, 업데이트를 하죠.
            return await UpdateThumbUp()
                .then(updateResult => updateResult);
        }

        // 이미 전에 엄지척을 누른적이 있으므로, 아무것도 안하고 하이패스.
        return new Result(true, '이미 엄지척을 누르셨어요.', 0, count.userList.length);
    }

    // 엄지척 카운트 가져오기.
    public async getCount(docuId: string) {
        const result: any = await this.model.findOne({ documentId: docuId })
            .catch(err => { console.error(err); return -1; });

        if (result === -1)
            return new Result(false, '엄지척이 없거나 가져오는 도중에 문제가 발생했어요.');

        if (result === null)
            return new Result(true, '엄지척이 없어요. 그치만 오류는 아니니까 0 돌려줄께요.', 0, 0);

        if (result.userList === undefined || result.userList.length < 1)
            return new Result(true, 'userList가 비어있긴 한데, 오류는 아니니까 0 돌려줄께요.', 0, 0);

        return new Result(true, '엄지척 가져오기 성공.', 0, result.userList.length);
    }
    
}