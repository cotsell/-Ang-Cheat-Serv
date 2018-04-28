import * as express from 'express';
import * as Mongo from '../DB/Mongo';
import { Category } from '../interface';

export const route = express.Router();

route.post('/', (req, res) => {
    let dummy: Category = {
        _id: req.body._id,
        title: req.body.title,
        tag: req.body.tag,
        grade: 1,
        historyId: req.body.historyId,
        subCategory: [{ title: 'test2', 
                        tag: 'testtag2', 
                        grade: 2, 
                        subCategory: [{ title: 'test3',
                                        tag: 'testtag3',
                                        grade: 3 
                        }] 
        }]
    };
                            
    // req.body의 객체 내용 중 id의 내용이 있는지 없는지로 새로운 카테고리인지,
    // 기존 카테고리의 내용을 update할 것인지를 판단, 시행.
    insertNewCategory(req.body, res);
    updateCategory(req.body, res);

    function insertNewCategory(body: Category, res: express.Response) {
        if (body._id === undefined || body._id === null || body._id === '') {
            console.log('Body doesnt have id.');
            
            Mongo.getCategory().insertCategory(dummy)
                .then(value => { console.log(value); });
        }
    }

    function updateCategory(body: Category, res: express.Response) {
        if (body._id !== undefined && body._id !== null && body._id !== '') {
            console.log('Body has id.');

            Mongo.getCategory().updateCategory(dummy)
                .then(value => { 
                    console.log(value); 
                    res.json(value);
                });
        }
    }
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
route.get('/:id/get', (req, res) => {
    let { id } = req.params;
    console.log(`${id} 라는 카테고리 _id로 카테고리 요청이 들어왔어요.`);
    
    Mongo.getCategory().getCategory(id)
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