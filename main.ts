import * as express from 'express';
import * as bodyParser from 'body-parser';
import { route as Route } from './routes/root';
import { route as accountRoute } from './routes/account';
import { route as documentRoute } from './routes/document';
import { route as categoryRoute } from './routes/category';
import { route as replyRoute } from './routes/reply';
import * as mongo from './DB/Mongo';
import * as multer from 'multer';
import * as cors from 'cors';
import * as conf from './sysConf'; 
import { Result } from './interface';

const app = express();
mongo.connect(conf.mongoUrl);
app.use(express.static('public'));
app.use('/userProfileImgs', express.static('userProfileImgs')); // __dirname을 쓰면 일단은 안되고 있음.. 이유가 뭘까?
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// 동일출처정책(CORS)를 해결하기 위해 해더에 다음과 같은 내용을 추가.
// 이 항목은 가능한 미들웨어 선언 이후에 위치하도록 하자.
// app.use((req, res, next) => {
// 	res.header('Access-Control-Allow-Origin', '*');
// 	res.header('Access-Control-Allow-Headers', 'X-Requested-With, Origin, Accept, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, c-access-token');
// 	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS, DELETE');
// 	next();
// });

// 라우터 설정
app.use('/', Route);
app.use('/account', accountRoute);
app.use('/document', documentRoute);
app.use('/category', categoryRoute);
app.use('/reply', replyRoute);

const httpServer = app.listen(8010, '', () => {
  console.log(`port: ${ httpServer.address().port }`);
});
