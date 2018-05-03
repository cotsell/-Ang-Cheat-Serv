import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import * as jwt from '../jwt';
import * as conf from '../sysConf';
import { Result } from '../interface';
export const route = express.Router();

route.get('/search', (req, res) => {

    const lang = req.query['lang'];
    const type = req.query['type'];
    const subj = req.query['subj'];

    Mongo.getDocument().searchDocuments(lang, type*1, subj)
    .then(value => {
        res.json(value);
    });
});

// 스크랩하기.
route.post('/scrap', (req, res) => {
    // ---- 정리용도 함수 모음 -----------------------------------
    function hasError(at: string, id: string) {
        if (at === undefined || at === '' ||
            id === undefined || id === '') 
            return true;
        else   
            return false;
    }
    // ---- 정리용도 함수 모음 끝 -------------------------------

    const accessToken = req.headers['c-access-token'] + '';
    const documentId = req.body['documentId'] + '';

    if (hasError(accessToken, documentId))
        res.json(new Result(false, '필수 요소를 정확히 입력 해주세요.'));

    if (!jwt.verify(accessToken))
        res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';

    Mongo.getScrap().setScrap(userId, documentId)
        .then(result => {
            res.json(result);
        });
});

// 스크랩 가져오기.
route.get('/scrap/get', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';

    if (!jwt.verify(accessToken))
        res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';

    Mongo.getScrap().getScrap(userId)
        .then(result => {
            res.json(result);
        });
});

route.get('/thumbup/:docuId', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const docuId = req.params['docuId'] + '';

    // if (!jwt.verify(accessToken))
    //     res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

    // const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';
    const userId = 'cotsell@gmail.com';
    Mongo.getThumbUp().insertThumbUp(docuId, userId)
        .then(result => {
            res.json(result);
        });
});
