import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import { DocumentInfo, UserInfo, Result } from '../interface';
import * as jwt from '../jwt';
import * as conf from '../sysConf';

export const route = express.Router();
const ACCESS_TOKEN_ERROR = 1;

// 문서 한개를 조회해줘요.
route.get('/documentOne/:docHistoryId', (req, res) => {
  const accessToken = req.get('c-access-token');
  const { docHistoryId } = req.params;
  let promise;

  if (accessToken === undefined || accessToken === '') {
    console.log(`엑세스토큰이 없어요. ${accessToken}`);
    promise = Mongo.getDocument().getDocumentOne(docHistoryId);
  } else {
    console.log(`엑세스토큰이 있어요. ${accessToken}`);
    
    let userId;
    if (!jwt.verify(accessToken)) {
      res.json(new Result(false, '엑세스토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));
      return;
    }
    userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'];
    promise = Mongo.getDocument().getDocumentOne(docHistoryId, userId);
  }

  // Mongo.getDocument().getDocumentOne(docHistoryId)
  promise.then(value => {
    console.log(value);
    console.log();
    res.json(value);
  });
});

// 문서 만들기.
route.post('/new', (req, res) => {
  console.log('새로운 문서 작성 요청이 들어왔어요.');
  const accessToken = req.get('c-access-token');
  const doc: DocumentInfo = req.body;

  console.log(doc);

  if (!jwt.verify(accessToken)) {
    res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));
    return;
  }

  if (doc.tagList === undefined || doc.tagList.length < 1) {
    res.json(new Result(false, '언어선택이 되지 않았어요.', 2));
    return;
  }

  Mongo.getDocument().insertNewDocument(doc)
  .then(value => {
    console.log(value);
    console.log();
    res.json(value);
  });
});

// 문서 수정.
route.post('/modify', (req, res) => {
  const accessToken = req.get('c-access-token');
  const doc: DocumentInfo = req.body;

  if (!jwt.verify(accessToken)) {
    res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));
    return;
  }

  let userId = jwt.decode(accessToken)['userId'];

  if (doc.tagList === undefined || doc.tagList.length < 1) {
    res.json(new Result(false, '언어선택이 되지 않았어요.', 2));
    return;
  }

  Mongo.getDocument().modifyDocument(doc, userId)
  .then(value => {
    console.log('문서 업데이트 결과:');
    console.log(value.msg);
    // console.log(value.payload);
    res.json(value);
  });
});

// 문서 삭제.
route.post('/remove', (req, res) => {
  const accessToken = req.get('c-access-token');
  const doc: DocumentInfo = req.body;

  if (!jwt.verify(accessToken)) {
    res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));
    return;
  }

  const userId = jwt.decode(accessToken)['userId'];

  console.log(`[문서 삭제 요청]`);
  console.log(`${userId} 유저가 ${req.body.documentId} 문서의 삭제 요청을 했어요.`);

  Mongo.getDocument().removeDocument(doc, userId)
  .then(value => {
      console.log('문서 삭제 결과:');
      console.log(value.msg);
      res.json(value);
  });
});

// 문서에 태그 입력
route.post('/tag/new', (req, res) => {
  let accessToken = req.get('c-access-token');

  // 엑세스토큰에 문제가 있다면 강퇴.
  if (!jwt.verify(accessToken)) 
      res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

  let userId = jwt.decode(accessToken)['userId'];

  console.log(`[태그입력 요청]`);
  console.log(`${userId} 유저가 ${req.body.documentId} 문서에 ${req.body.tag} 태그 입력 요청을 했어요.`);

  Mongo.getDocument().setTag(req.body.documentId, userId, req.body.tag)
  .then(value => {
      console.log('새로운 태그 입력 결과:');
      console.log(value.msg);
      res.json(value);
  });
});

// 문서에서 태그 삭제
route.post('/tag/remove', (req, res) => {
  let accessToken = req.get('c-access-token');

  // 엑세스토큰에 문제가 있다면 강퇴.
  if (!jwt.verify(accessToken)) 
      res.json(new Result(false, '엑세스토큰에 문제가 있어요.', ACCESS_TOKEN_ERROR));

  let userId = jwt.decode(accessToken)['userId'];

  console.log(`[태그삭제 요청]`);
  console.log(`${userId} 유저가 ${req.body.documentId} 문서에 ${req.body.tag} 태그 삭제 요청을 했어요.`);

  Mongo.getDocument().removeTag(req.body.documentId, userId, req.body.tag)
  .then(value => {
      console.log('태그 삭제 결과:');
      console.log(value);
      res.json(value);
  })
});

// TODO 수정해야 함. 지금 사용 안함. 용도 변경할 것임.
// 특정 유저가 작성한 문서 리스트 검색.
route.get('/userDocumentList', (req, res) => {
  const userId = req.query['id'];

  console.log(`[문서 리스트 요청]`);
  console.log(`${userId} 유저가 작성한 문서 리스트의 ID 리스트 요청.`);

  Mongo.getDocument().searchUserDocumentIds(userId)
  .then(value => {
      res.json(value);
  });
});

// 특정 유저가 작성한 문서의 총 숫자를 알려줘요. 
// private는.. 무시하고 알려줘요.
route.get('/userDocumentsCount', (req, res) => {
  const userId = req.query['id'];

  console.log(`[${userId} 유저가 작성한 문서들의 카운트 요청]`);
  console.log(`${userId} 유저가 작성한 문서들의 카운트 요청들이 들어왔어요.`);

  Mongo.getDocument().getUserDocumentsCount(userId)
  .then(value => {
    res.json(value);
  })
});
