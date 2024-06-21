import crypto,{createHash} from 'crypto'

const encryp = (algorithm, content) => {
    let hash = createHash(algorithm);
    hash.update(content);
    return hash.digest('hex')
};

const sha1 = (content) => {
    return encryp('sha1', content);
};

const encrypt = (str)=>{
    return sha1(sha1(str))
};

console.info('--------',encrypt('test123fgy'));