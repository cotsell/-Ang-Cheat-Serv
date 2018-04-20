import * as jwt from 'jsonwebtoken';
import * as conf from './sysConf';

export function createJwt(payload: any): string {
    return jwt.sign(
        payload,
        conf.SECRET,
        {
            expiresIn: '1d',
            issuer: 'cotsell',
            subject: 'user'
        }
    );
}

export function verify(accessToken: string): boolean {
    let trueOrFalse = false;
    try {
        let result = jwt.verify(accessToken, conf.SECRET);
        // console.log(result);
        trueOrFalse = true;
    } catch(expeption) {
        console.log('Access Token에 문제가 있어요.');
        trueOrFalse = false;
    }
    return trueOrFalse;
}

export let decode = jwt.decode;
