import * as express from 'express';
import * as Mongo from '../DB/Mongo';
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
