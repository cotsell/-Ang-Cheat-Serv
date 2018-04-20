import * as mongoose from 'mongoose';
import { Schema, Model, Document } from 'mongoose';
import { Result, Category as iCategory } from '../interface';

export default class Category {
    private schema: Schema;
    private model: Model<Document>;

    constructor() {
        this.schema = this.setSchema();
        this.model = mongoose.model<Document>('category', this.schema);
    }

    setSchema(): Schema {
        let schema = new mongoose.Schema({
            title: { type: String },
            tag: { type: String, lowercase: true },
            grade: { type: Number, min: 1, max: 1 },
            createdTime: { type: Date, default: Date.now },
            deleted: { type: Boolean, default: false },
            historyId: { type: String, default: '' },
            subCategory: [
                {
                    title: String,
                    tag: { type: String, lowercase: true },
                    grade: { type: Number, min: 2, max: 2 },
                    subCategory: [
                        {
                            title: String,
                            tag: { type: String, lowercase: true },
                            grade: { type: Number, min: 3, max: 3 }
                        }
                    ]
                }
            ]
        });

        return schema;
    }

    public async insertCategory(category: iCategory): Promise<Result> {
        // console.log('insertCategory()');
        // console.log(category);

        let result = await this.model.count({ title: category.title, deleted: false });

        if (result > 0) {
            return { result: false, msg: '이미 존재하는 카테고리에요.' };
        } else {
            delete category._id; // update를 통해 새로운 글을 작성할 경우에는 _id가 필요 없어요.
            
            let doc = new this.model(category);
            let result = await doc.save();
            return { result: true, payload: result, msg: '새로운 카테고리 생성 완료.' };
        }
    }

    public async updateCategory(category: iCategory): Promise<Result> {
        let result = await this.model.count({ _id: category._id, deleted: false })
            .catch(err => -1);

        if(result > 0) {
            let reuslt = await this.model.updateOne({ _id: category._id }, { $set: { deleted: true } });

            if (result > 0) {

                // HistoryId 관련 처리.
                if (category.historyId === '' ||
                    category.historyId === undefined ||
                    category.historyId === null) {
                    category = Object.assign({}, category, { historyId: category._id });
                }

                let result = await this.insertCategory(category)
                    .then(checkingResult);

                return result;
            } else {
                return { result: false, msg: '업데이트 실패.' };
            }

        } else {
            return { result: false, msg: '존재하지 않는 카테고리여서, 업데이트 할 수 없어요.' };
        }


        function checkingResult(value: Result) {
            if (value.result === true) {
                return value;
            } else {
                value.msg = '알 수 없는 문제로, 카테고리 업데이트에 실패 했어요.';
                return value;
            }
        }
    }

    public async getCategory(id: string) {
        console.log('카테고리 가져오기 시작\n');

        let result = await this.model.findOne({ _id: id, deleted: false })
            .catch(err => -1);

        if (result === -1 || result === 0 || result === null)
            return { result: false, msg: '해당 카테고리는 존재하지 않거나, 삭제 된 카테고리에요.' };
        else
            return { result: true, msg: '가져오기 성공이에요.', payload: result };
    }

    public async getAllGrade1Categorys() {
        console.log('모든 카테고리 가져오기 시작\n');

        let msg: string;
        let result = await this.model.find(
            { deleted: false },
            { _id: true, title: true, tag: true, grade: true });

        if (result.length === 0)
            return { result: false, msg: '카테고리가 하나도 없어요..' };
        else
            return { result: true, msg: '카테고리 가져오기 성공이에요.', payload: result };
    }
}