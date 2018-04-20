import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import * as jwt from '../jwt';
import { Result } from '../interface';

export const route = express.Router();

// AccessToken으로 로그인 처리.
route.get('/check', (req, res) => {
    const accessToken = req.headers['c-access-token'];
    
    // string형태만 받을 수 있어서, 강제로 빈 공백을 더해줘서 string으로 캐스팅 했어요.
    let result = jwt.verify(accessToken+'');
    res.json(new Result(result));
});

// 가입처리.
route.post('/signup', (req, res) => {
    console.log(`${ req.body.id } 라는 id로 가입신청을 시도합니다.\n`);
    
    Mongo.getAccount().insertNewUser(req.body)
        .then(value => {
            // console.log(value);
            let result = value;

            if (value.result === true) {

                let accessToken = jwt.createJwt({ userId: value.payload.id });

                result = Object.assign({}, value,
                    { payload: Object.assign({}, value.payload, { accessToken: accessToken })}
                );
            }

            console.log('가입 신청 응답 결과:');
            console.log(JSON.stringify(result) + '\n');
            res.json(result);
        });
});

// 로그인
route.post('/login', (req, res) => {
    let { id, password } = req.body;
    console.log(`${ id } 유저가 로그인을 시도합니다.\n`);

    Mongo.getAccount().countUser(req.body)
        .then(value => {
            if (value === 1) {
                let accessToken = jwt.createJwt({ userId: id });
                res.json(new Result(true, '', 0, { accessToken: accessToken }));
            } else {
                res.json(new Result(false, 'ID혹은 비밀번호가 틀렸어요.'));
            }
        })
});

route.post('/user', (req, res) => {
    const { id } = req.body; 
    console.log(`${ id } 유저의 정보 조회 요청이 들어왔어요.\n`);

    Mongo.getAccount().findUserOne(req.body)
        .then(value => {
            let result: any;

            if (value === null) {
                console.log(value);
                result = { result: false, msg: '해당 유저의 정보가 없어요.\n' };
            } else {
                console.log(value);
                result = { result: true, payload: value };
            }
            res.json(result);
        });
});
