import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import { DocumentInfo, UserInfo, Result } from '../interface';
import * as jwt from '../jwt';

export const route = express.Router();
const ACCESS_TOKEN_ERROR = 1;

route.get('/:id', (req, res) => {
    let { id } = req.params;
    Mongo.getDocument().getDocumentOne(id)
        .then(value => {
            console.log(value);
            console.log();
            res.json(value);
        });
});

route.post('/new', (req, res) => {
    console.log('새로운 문서 작성 요청이 들어왔어요.');
    const accessToken = req.headers['c-access-token'] + '';
    const doc: DocumentInfo = req.body;

    console.log(doc);

    if (!jwt.verify(accessToken))
        res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

    Mongo.getDocument().insertNewDocument(doc)
        .then(value => {
            console.log(value);
            console.log();
            res.json(value);
        });
});

route.post('/modify', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const doc: DocumentInfo = req.body;

    if (!jwt.verify(accessToken))
        res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

    let userId = JSON.parse(JSON.stringify(jwt.decode(accessToken)))['userId'];

    Mongo.getDocument().modifyDocument(doc, userId)
    .then(value => {
        console.log('문서 업데이트 결과:');
        console.log(value.msg);
        // console.log(value.payload);
        res.json(value);
    });
});

route.post('/remove', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const doc: DocumentInfo = req.body;

    if (!jwt.verify(accessToken))
        res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

    const userId = JSON.parse(JSON.stringify(jwt.decode(accessToken)))['userId'];

    Mongo.getDocument().removeDocument(doc, userId)
    .then(value => {
        console.log('문서 삭제 결과:');
        console.log(value.msg);
        res.json(value);
    });
});

// 문서에 태그 입력
route.post('/tag/new', (req, res) => {
    // console.log(req.headers['c-access-token']);
    // console.log(req.body);
    let accessToken = req.headers['c-access-token'] + '';

    // 엑세스토큰에 문제가 있다면 강퇴.
    if (!jwt.verify(accessToken)) 
        res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

    let userId = JSON.parse(JSON.stringify(jwt.decode(accessToken)))['userId'];

    Mongo.getDocument().setTag(req.body.documentId, userId, req.body.tag)
    .then(value => {
        console.log('새로운 태그 입력 결과:');
        console.log(value.msg);
        res.json(value);
    });
});

// 문서에서 태그 삭제
route.post('/tag/remove', (req, res) => {
    let accessToken = req.headers['c-access-token'] + '';

    // 엑세스토큰에 문제가 있다면 강퇴.
    if (!jwt.verify(accessToken)) 
        res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

    let userId = JSON.parse(JSON.stringify(jwt.decode(accessToken)))['userId'];

    Mongo.getDocument().removeTag(req.body.documentId, userId, req.body.tag)
    .then(value => {
        console.log('태그 삭제 결과:');
        console.log(value);
        res.json(value);
    })
    
});