import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import { Category, Result } from '../interface';
import * as jwt from '../jwt';
import * as conf from '../sysConf';

export const route = express.Router();

route.post('/', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';

    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'];

    // req.body의 객체 내용 중 id의 내용이 있는지 없는지로 새로운
    // 카테고리인지, 기존 카테고리의 내용을 update할 것인지를 판단, 시행.
    insertNewCategory(userId, req.body, res);
    updateCategory(userId, req.body, res);

    // ---- 정리용도 함수 모음 -----------------------------------
    
    function insertNewCategory(userId: string, body: Category, res: express.Response) {
        if (body._id === undefined || body._id === null || body._id === '') {
            console.log('Body doesnt have id.');

            const data = Object.assign({}, 
                { ...body, updatedBy: userId });
            
            Mongo.getCategory().insertCategory(data)
                .then(value => { 
                    console.log(value);
                    res.json(value);
                });
        }
    }

    function updateCategory(userId: string, body: Category, res: express.Response) {
        if (body._id !== undefined && body._id !== null && body._id !== '') {
            console.log('Body has id.');

            body.updatedBy = userId;

            Mongo.getCategory().updateCategory(body)
                .then(value => { 
                    console.log(value); 
                    res.json(value);
                });
        }
    }

    // ---- 정리용도 함수 모음 끝 -------------------------------

    
});

// 모든 1grade 카테고리 가져오기
route.get('/get', (req, res) => {
    Mongo.getCategory().getAllGrade1Categorys()
        .then(value => { 
            console.log(value); 
            res.json(value); 
        });
});

// 해당 id의 카테고리 전체 가져오기
route.get('/get/:id', (req, res) => {
    let { id } = req.params;
    const historyId = id;
    console.log(`${id} 라는 카테고리 _id로 카테고리 요청이 들어왔어요.`);
    
    Mongo.getCategory().getCategory(historyId)
        .then(value => { 
            console.log(value);
            res.json(value);
         });
});

// 모든 카테고리 가져오기.
route.get('/all', (req, res) => {
    console.log(`모든 카테고리 가져오기 요청이 들어왔어요.`);
    Mongo.getCategory().getAllCategory()
        .then(value => {
            res.json(value);
        });
});

// 해당 ID 카테고리 삭제.
route.get('/remove/:id', (req, res) => {
    const accessToken = req.headers['c-access-token'] + '';
    const id = req.params['id'] + '';

    if (!jwt.verify(accessToken))
        return new Result(false, '엑세스토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR);

    const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'];

    console.log(`${userId} 유저가 ${id} 카테고리 삭제를 요청했어요.`);

    Mongo.getCategory().removeCategory(userId, id)
        .then(result => {
            res.json(result);
        });
});