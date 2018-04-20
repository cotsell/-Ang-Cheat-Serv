import * as mongoose from 'mongoose';
import Account from './account';
import Document from './document';
import Category from './category';

let account = new Account();
let document = new Document();
let category = new Category();

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