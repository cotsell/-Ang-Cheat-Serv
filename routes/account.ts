import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import * as jwt from '../jwt';
import { Result, UserInfo } from '../interface';
import * as Multer from 'multer';
import * as fs from 'fs';

export const route = express.Router();
const ACCESS_TOKEN_ERROR = 1;

// -----------------------------------------------------------
// ---- Multer 관련

const storage = Multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'userProfileImgs');
	},
	filename: (req, file, cb) => {
    cb(null, file.originalname + '-' + Date.now());
	}
});
const multer = Multer({ storage: storage });

// ---- Multer 관련 끝
// -----------------------------------------------------------

// AccessToken으로 로그인 처리.
route.get('/check', (req, res) => {
  const accessToken = req.get('c-access-token');
  
  let result = jwt.verify(accessToken);
  res.json(new Result(result));
});

// 가입처리.
route.post('/signup', (req, res) => {
  console.log(`${ req.body.id } 라는 id로 가입신청을 시도합니다.\n`);

  Mongo.getAccount().insertNewUser(req.body)
  .then(value => {
    let result = value;

    if (value.result === true) {

      let accessToken = jwt.createJwt({ userId: value.payload.id });

      // result = Object.assign({}, value,
      //   { payload: Object.assign({}, value.payload, { accessToken: accessToken })}
      // );

      result = Object.assign({}, value,
        { payload: { ...value.payload, accessToken: accessToken } });

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

  Mongo.getAccount().checkIdAndPassword(req.body)
  .then(value => {
    if (value === 1) {
      let accessToken = jwt.createJwt({ userId: id });
      res.json(new Result(true, '로그인 완료.', 0, { accessToken: accessToken }));
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

// 두명 이상의 유저 정보를 돌려줍니다. 사실 한명도 되긴 해요. 
route.post('/users', (req, res) => {
  const ids = req.body['ids'];

  Mongo.getAccount().findUsers(ids)
  .then(value => {
    res.json(value);
  });
});

// 회원의 비밀번호를 변경합니다. 
route.post('/user/changePassword', (req, res) => {
  const accessToken = req.get('c-access-token');
  const oldPass = req.body['oldPass'] + '';
  const newPass = req.body['newPass'] + '';

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스토큰에 이상이 있어요.', ACCESS_TOKEN_ERROR));

  if (oldPass === undefined || oldPass === null || oldPass === '' ||
      newPass === undefined || newPass === null || newPass === '')
    res.json(new Result(false, '잘못된 유형의 비밀번호에요.'));

  const userId = jwt.decode(accessToken)['userId'];

  console.log(`${userId} 유저의 패스워드 변경 요청이 들어왔어요.`);

  Mongo.getAccount().changePassword(userId, oldPass, newPass)
  .then(value => {
    console.log(`${userId} 유저의 패스워드 변경 요청 결과에요.`);
    console.log(value.msg);
    console.log(value.payload);
    
    res.json(value);
  });
});

// 회원의 비밀번호가 맞는지 확인해줍니다.
route.post('/user/checkPassword', (req, res) => {
  const accessToken = req.headers['c-access-token'] + '';
  const pass = req.body['password'] + '';

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스토큰에 이상이 있어요.', ACCESS_TOKEN_ERROR));

  if (pass === undefined || pass === null || pass === '')
    res.json(new Result(false, '잘못된 유형의 비밀번호에요.'));

  const userId = JSON.parse(JSON.stringify(jwt.decode(accessToken)))['userId'];

  console.log(`${userId} 유저의 패스워드 확인 요청이 들어왔어요.`);

  Mongo.getAccount().checkIdAndPassword({ id: userId, password: pass })
  .then(value => {
    if (value === 1)
      res.json(new Result(true, '확인 완료.'));
    else 
      res.json(new Result(false, '틀린 비밀번호에요.'));
  });
});

// 회원 정보 변경해줘요.
route.post('/user/update', (req, res) => {
  const accessToken = req.get('c-access-token');
  const userInfo: UserInfo = req.body;

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스토큰에 이상이 있어요.', ACCESS_TOKEN_ERROR));

  const userId = jwt.decode(accessToken)['userId'];
  
  if (hasNickNameError(userInfo.nickName)) 
    res.json(new Result(false, '닉네임 유형이 잘못되었어요.'));

  Mongo.getAccount().updateUserInfo(userId, userInfo)
  .then(result => {
    res.json(result);
  });

  // ---- 정리용도 함수 모음 ----

  // 닉네임 에러 체크함수에요. 문제가 있으면 true를 리턴해요.
  // 따로 만든 이유는 에러 체크할 사항이 늘어나게 되면 복잡하니까..
  function hasNickNameError(nickName: string | undefined): boolean {
    if (userInfo.nickName === undefined || userInfo.nickName === '')
      return true;
    else
      return false;
  }
});

// 프로필 이미지를 변경해줘요.
// 1. multer가 이미지를 임의(설정된)의 이름으로 저장.
// 2. 해당 이미지를 userId-Date.now() 이름으로 변경.
// 3. userInfo의 profileImgUrl에 변경한 이름을 저장.
// 4. userInfo의 변경 정 정보를 바탕으로 기존 이미지를 삭제.
route.post('/user/changeUserImg', multer.single('userimg'), (req, res) => {
  const accessToken = req.get('c-access-token');

  if (!jwt.verify(accessToken)) {
    res.json(new Result(false, '엑세스토큰에 이상이 있어요.', ACCESS_TOKEN_ERROR));
    return;
  }

  const userId = jwt.decode(accessToken)['userId'];
  const newUrl = 'userProfileImgs/' + userId + '-' + Date.now();
  const imgUrl = req.file.path;

  fs.rename(imgUrl, newUrl, (err) => {
    if (err) {
      console.error(`유저 프로필 이미지 이름 변경 중 문제 발생.`)
      console.error(err);
      console.error();
      unlink(imgUrl);

    } else {

      Mongo.getAccount().updateUserImgUrl(userId, newUrl)
      .then(result => {

        if (result.result) {
          unlink(result.payload.oldUrl);
          result.payload = newUrl;
        }

        res.json(result);
      });
    }
  });

  // -----------------------------------------------------------
  // ---- 정리용도 함수 모음.
  // -----------------------------------------------------------
  function unlink(oldUrl: string) {
    fs.unlink(oldUrl, (err) => {
      if (err) {
        console.error(`파일 삭제 시도 중 에러 생겼어요.`);
        console.error(err);
        console.error();
      }
    });
  }
});
