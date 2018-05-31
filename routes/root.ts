import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import * as jwt from '../jwt';
import * as conf from '../sysConf';
import { Result, pageCursor } from '../interface';
export const route = express.Router();

route.get('/search', (req, res) => {

  const lang = req.query['lang'];
  const type = req.query['type'];
  const subj = req.query['subj'];
  const cursor: pageCursor = 
    { 
      cursor: req.query['cursor'],
      countPerPage: req.query['cpp'],
      totalCount: req.query['total']  
    };

  Mongo.getDocument().searchDocuments(lang, type*1, subj, cursor)
  .then(value => {
    res.json(value);
  });
});

// 스크랩하기.
route.post('/scrap', (req, res) => {
  // ---- 정리용도 함수 모음 -----------------------------------
  function hasError(at: string, label: any) {
    if (at === undefined || at === '' ||
      label === undefined ||
      label.isNew === undefined ||
      label.documentId === undefined || label.documentId === '' ||
      label.documentTitle === undefined || label.documentTitle === '' ||
      label.label === undefined || label.label === '') 
      return true;
    else   
      return false;
  }
  // ---- 정리용도 함수 모음 끝 -------------------------------

  const accessToken = req.headers['c-access-token'] + '';
  const label = req.body;

  if (hasError(accessToken, label))
    res.json(new Result(false, '필수 요소를 정확히 입력 해주세요.'));

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

  const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';

  Mongo.getScrap().setScrap(userId, label)
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

route.post('/scrap/remove', (req, res) => {
  const accessToken = req.headers['c-access-token'] + '';
  const article = req.body;

  if (article === undefined || article.label === undefined)
      res.json(new Result(false, '필수 항목이 비어있어요.'));

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

  const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';

  let promise;
  if (article.docuId === undefined) 
    promise = Mongo.getScrap().removeLabel(userId, article.label);
  else
    promise = Mongo.getScrap().removeArticle(userId, article.label, article.docuId);
  
  promise.then(result => {
    res.json(result);
  });
});

// 엄지척 하기.
route.get('/thumbup/:docuId', (req, res) => {
  const accessToken = req.headers['c-access-token'] + '';
  const docuId = req.params['docuId'] + '';

  if (!jwt.verify(accessToken))
    res.json(new Result(false, '엑세스 토큰에 문제가 있어요.', conf.ACCESS_TOKEN_ERROR));

  const userId = Mongo.Util.parse(jwt.decode(accessToken))['userId'] + '';
  // const userId = 'hohosang';
  Mongo.getThumbUp().insertThumbUp(docuId, userId)
  .then(result => {
    res.json(result);
  });
});

// 엄지척 갯수 가져오기.
route.get('/thumbup/getCount/:docuId/', (req, res) => {
  const docuId = req.params['docuId'] + '';

  Mongo.getThumbUp().getCount(docuId)
  .then(result => {
    res.json(result);
  });
});