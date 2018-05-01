import * as mongoose from 'mongoose';
import Account from './account';
import Document from './document';
import Category from './category';
import Reply from './reply';

let account = new Account();
let document = new Document();
let category = new Category();
const reply = new Reply();

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

export class Util {
    static parse(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }
}