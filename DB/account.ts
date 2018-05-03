import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import { Document, Model, Schema } from 'mongoose';
import { UserInfo, Result } from '../interface';
import * as conf from '../sysConf';
import {Util} from './Mongo';

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
            // myScrapIdList: { type: [String] },
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

        // ID와 Password에 이상이 있을 때의 필터링.
        if (user.id === undefined || user.id === null || user.id === '' ||
            user.password === undefined || user.password === null || user.password === ''
        ) {
            return new Result(false, 'ID혹은 패스워드가 비었거나, 문제가 있어요.');
        }

        // 결과가 없으면 0, 있으면 1.
        let result: any = await this.model.count({ id: user.id });

        if (result >= 1) {

            console.log('이미 있는 사용자에요.\n');
            return new Result(false, '이미 있는 사용자.');

        } else {

            const userPassword = user.password || '';
            const encryptedPassword = crypto.createHmac('sha1', conf.SECRET)
                .update(userPassword)
                .digest('base64');

            let doc: Document = new this.model({
                id: user.id,
                password: encryptedPassword,
                grade: 9,
                nickName: user.nickName,
                profileImgUrl: '',
                // myScrapIdList: [],
                totalThumbUp: 0,
                signature: '',
            });

            result = await doc.save().catch(err => { return null; });
            
            if (result === null) {
                return new Result(false, 'ID혹은 닉네임이 중복되었어요.');
            } else {
                return new Result(true, '가입 성공', 0, result);
            }
        }
    }

    // 해당 조건의 사용자를 찾아서 있으면 1 없으면 0을 리턴해요.
    public async checkIdAndPassword(user: UserInfo): Promise<number> {
        const encryptedPassword = crypto.createHmac('sha1', conf.SECRET)
        .update(user.password + '')
        .digest('base64');

        console.log(encryptedPassword);
        
        let result = await this.model.count({ id: user.id, password: encryptedPassword });
        return result;
    }

    // 유저 한명의 정보를 찾아서 돌려줘요.
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

    public async changePassword(userId: string, oldPass: string, newPass: string) {
        const encryptedOldPass = crypto.createHmac('sha1', conf.SECRET)
        .update(oldPass).digest('base64');
        const encryptedNewPass = crypto.createHmac('sha1', conf.SECRET)
        .update(newPass).digest('base64');

        const result = await this.model.updateOne(
            { id: userId, password: encryptedOldPass }, 
            { $set: { password: encryptedNewPass, updatedTime: Date.now() } }
        ).catch(err => {
            console.log(err);
            return null;
        });

        if (result === null)
            return new Result(false, '변경 실패.');
        if (JSON.parse(JSON.stringify(result))['nModified'] === 0)
            return new Result(false, '변경 실패.');

        return new Result(true, '변경 완료.', 0, result);
    }

    public async updateUserInfo(userId: string, userInfo: UserInfo){
        const updateResult = await this.model.updateOne({ id: userId }, { $set: userInfo }).catch(err => { 
            console.error(err);
            return null;
            }
        );

        if (Util.parse(updateResult)['nModified'] === 1)
            return new Result(true, '변경 완료', 0, updateResult);
        
        return new Result(false, '변경 실패.');

    }
}