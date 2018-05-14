import * as jwt from 'jsonwebtoken';
import * as conf from './sysConf';
import { Util } from './DB/Mongo';

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

export function verify(accessToken: string | undefined): boolean {
    let trueOrFalse = false;

    if (accessToken !== undefined) {
        try {
            let result = jwt.verify(accessToken, conf.SECRET);
            // console.log(result);
            trueOrFalse = true;
        } catch(expeption) {
            console.log('Access Token에 문제가 있어요.');
            trueOrFalse = false;
        }
    } 
    
    return trueOrFalse;
}

export function decode(code: string | undefined) {
    if (code !== undefined) {
        return Util.parse(jwt.decode(code));
    } else {
        return undefined;
    }
} // = jwt.decode;

