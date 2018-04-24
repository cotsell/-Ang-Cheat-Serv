import * as mongoose from 'mongoose';
import { Document, Model, Schema } from 'mongoose';
import { UserInfo, Result } from '../interface';

interface accountDocument extends Document {
    id?: string;
    password?: string;
    nickName?: string;
    grade?: number;
}

export default class Account {
    private schema: Schema;
    private model: Model<Document>;

    constructor() {
        this.schema = this.setSchema();
        this.model = mongoose.model<Document>('account', this.schema);
    }

    setSchema(): Schema {
        const schema: Schema =  new Schema({
            id: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            grade: { type: Number, required: true },
            nickName: { type: String, unique: true },
            profileImgUrl: { type: String },
            // myDocumentIdList: { type: [String] },
            myScrapIdList: { type: [String] },
            totalThumbUp: { type: Number },
            signature: { type: String },
            createdTime: { type: Date, default: Date.now },
            updatedTime: { type: Date, default: Date.now }
        });

        return schema;
    }

    public getSchema(): Schema {
        return this.schema;
    }

    public getModel(): Model<Document> {
        return this.model;
    }

    // DB에 해당 유저가 존재하는지 찾아보고, 없으면 삽입해요.
    public async insertNewUser(user: UserInfo): Promise<Result> {
        // 결과가 없으면 0, 있으면 1.
        let result: any = await this.model.count({ id: user.id });

        if (result >= 1) {

            console.log('이미 있는 사용자에요.\n');
            return new Result(false, '이미 있는 사용자.');

        } else {

            let doc: Document = new this.model({
                id: user.id,
                password: user.password,
                grade: 9,
                nickName: user.nickName,
                profileImgUrl: '',
                myScrapIdList: [],
                totalThumbUp: 0,
                signature: '',
            });
            result = await doc.save().catch(err => { return -1; });
            
            if (result === -1) {
                return new Result(false, 'ID혹은 닉네임이 중복되었어요.');
            } else {
                return new Result(true, '가입 성공', result);
            }
        }
    }

    // 해당 조건의 사용자를 찾아서 있으면 1 없으면 0을 리턴해요.
    public async countUser(user: UserInfo): Promise<number> {
        let result = await this.model.count({ id: user.id, password: user.password });
        return result;
    }

    public async findUserOne(user: UserInfo): Promise<Document | null> {
        let result = await this.model.findOne({ id: user.id }, { _id: false, password: false });
        return result;
    }

    // 두명 이상의 유저 정보를 돌려줍니다. 사실 한명도 되긴 해요. 
    public async findUsers(ids: string[]) {
        let conditions: Object[] = [];
        let condition = {};
        ids.map(value => {
            conditions.push({ id: value });
        });
        condition = Object.assign({}, { $or: [...conditions] });

        const result = await this.model.find(condition, { _id: false, password: false });
        if (result.length < 1)
            return new Result(false, '검색 결과가 없어요.');

        return new Result(true, '검색 성공', 0, result);
    }
}