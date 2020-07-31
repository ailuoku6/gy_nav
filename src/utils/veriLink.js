const linkPattern = /(http:\/\/|https:\/\/)(\w|[\u4e00-\u9fa5])+\.(\w|[\u4e00-\u9fa5])+(\.)*(\w|[\u4e00-\u9fa5])*\/*/;

const pswPattern = /[^\x00-\xff]+/;

export {
    linkPattern,
    pswPattern
}