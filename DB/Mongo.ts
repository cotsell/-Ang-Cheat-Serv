import * as mongoose from 'mongoose';
import Account from './account';
import Document from './document';
import Category from './category';
import Reply from './reply';
import Scrap from './scrap';
import ThumbUp from './thumbUp';

const account = new Account();
const document = new Document();
const category = new Category();
const reply = new Reply();
const scrap = new Scrap();
const thumbUp = new ThumbUp();

mongoose.connection.on('error', console.error);
mongoose.connection.once('open', () => { 
    console.log('Connected to mongoDB.'); 
});

export function connect(url: string) {
    mongoose.connect(url);
}

export function getAccount(): Account {
    return account;
}

export function getDocument() {
    return document;
}

export function getCategory(): Category {
    return category;
}

export function getReply(): Reply {
    return reply;
}

export function getScrap(): Scrap {
    return scrap;
}

export function getThumbUp(): ThumbUp {
    return thumbUp;
}

export class Util {
    static parse(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }
}