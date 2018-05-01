import * as express from 'express';
import * as jwt from '../jwt';
import * as Mongo from '../DB/Mongo';
import { Reply, Result } from '../interface';
import * as conf from '../sysConf';

export const route = express.Router();

// 해당 문서 전체리플 다 가져오기
// TODO 페이지 기능 지원하기.
route.get('/get/:docuId', (req, res) => {
    const docuId = req.params['docuId'] + ''

    Mongo.getReply().getAllReply(docuId)
        .then(result => {
            res.json(result);
        });
});

// 리플 작성
// parentId와 text, userId는 필수로 채워 넣어줘야 해요.
route.post('/', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const reply: Reply = req.body;

    if (!replyStateChecking(reply))
        return new Result(false, '필수 입력 항목에 문제가 있어요.');


    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    Mongo.getReply().makeReply(reply)
        .then(result => {
            res.json(result);
        });

    // ---- 정리용도 함수 모음 -----------------------------------
    function replyStateChecking(reply: Reply) {
        if (reply.parentId === undefined || reply.parentId === '' ||
            reply.text === undefined ||
            reply.userId === undefined || reply.userId === '') {
            return false;
        } else {
            return true;
        }
    }
    // ---- 정리용도 함수 모음 끝 -------------------------------
});

// 리리플 작성.
// parentId(댓글ID), text, userId는 필수로 넣어줘야 해요.
route.post('/rereply', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const rereply: Reply = req.body;

    if (!replyStateChecking(rereply))
        return new Result(false, '필수 입력 항목에 문제가 있어요.');

    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    Mongo.getReply().insertRereply(rereply)
        .then(value => {
            res.json(value);
        });

    // ---- 정리용도 함수 모음 -----------------------------------
    function replyStateChecking(reply: Reply) {
        if (reply.parentId === undefined || reply.parentId === '' ||
            reply.text === undefined ||
            reply.userId === undefined || reply.userId === '') {
            return false;
        } else {
            return true;
        }
    }
    // ---- 정리용도 함수 모음 끝 -------------------------------
});

// TODO
route.post('/update', (req, res) => {

});

// 리플을 삭제해요. 삭제하고, 새로 생성된 (삭제처리)된 리플을 돌려줘요.
route.get('/remove/:id', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const id = req.params['id'] + '';

    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'];

    Mongo.getReply().removeReply(userId, id)
        .then(value => {
            res.json(value);
        });
});

// 리리플을 삭제해요. 삭제하고, 새로 생성된 (처리된 리리플이 들어간) 리플을 돌려줘요.
route.post('/rereply/remove', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const rereply: Reply = req.body;

    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'];

    if (rereply.userId !== userId)
        return new Result(false, '해당 리플을 작성한 사용자가 아니에요. 누구세요!?');

    Mongo.getReply().removeRereply(userId, rereply)
        .then(value => {
            res.json(value);
        });
});