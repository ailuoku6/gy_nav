// import crypto, { createHash } from "node:crypto";
// import jsSHA from "jssha";

// const jssha = new jsSHA("SHA-1", "TEXT");

// const encryp = (algorithm: string, content: string) => {
//   return jssha.update(content).getHash("HEX");
// };

// const sha1 = (content: string) => {
//   return encryp("sha1", content);
// };

// const encrypt = (str: string) => {
//   return sha1(sha1(str));
// };

async function sha1Hash(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // 转换为字节数组
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // 转换为十六进制字符串
  return hashHex;
}

const encrypt = async (str: string) => {
  const res = await sha1Hash(await sha1Hash(str));
  return res;
};

// (async () => {
//   const res1 = await sha1Hash("test123fgy");
//   const res2 = await sha1Hash(res1);
//   console.log("--------encrypt", await encrypt("test123fgy"), res2);
// })();

// const algorithm = "aes-256-ctr";
// const iv = crypto.randomBytes(16);

// export const encryptData = (text: string, secretKey: string) => {
//   // const key = crypto.scryptSync(String(secretKey), "salt", 32);
//   // const cipher = crypto.createCipheriv(algorithm, key, iv);

//   // const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

//   // return {
//   //   iv: iv.toString("hex"),
//   //   content: encrypted.toString("hex"),
//   // };

//   return {
//     iv: '',
//     content: '',
//   };
// };

// export const decryptData = (
//   hash: { iv: string; content: string },
//   secretKey: string
// ) => {
//   // const key = crypto.scryptSync(String(secretKey), "salt", 32);
//   // const decipher = crypto.createDecipheriv(
//   //   algorithm,
//   //   key,
//   //   Buffer.from(hash.iv, "hex")
//   // );

//   // const decrypted = Buffer.concat([
//   //   decipher.update(Buffer.from(hash.content, "hex")),
//   //   decipher.final(),
//   // ]);

//   // return decrypted.toString();

//   return '';
// };

// async function convertKeyToFixedBits(secretKey:string) {
//   const encoder = new TextEncoder();
//   const encodedKey = encoder.encode(secretKey);
//   const hashBuffer = await crypto.subtle.digest('SHA-256', encodedKey);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
//   return hashHex;
// }

async function convertKeyToFixedBits(secretKey:string) {
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(secretKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32);
  // return hashHex;
}

export const encryptData = async (text: string, secretKey: string) => {
  const enc = new TextEncoder();
  const encodedKey = enc.encode(await convertKeyToFixedBits(secretKey));

  const key = await crypto.subtle.importKey(
    "raw",
    encodedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = enc.encode(text);
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );

  const buffer = new Uint8Array(encryptedData);
  const hexIv = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hexContent = Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { iv: hexIv, content: hexContent };
};

export const decryptData = async (
  hash: { iv: string; content: string },
  secretKey: string
) => {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const encodedKey = enc.encode(secretKey);
  console.log("解密后的文本：", 1);
  const key = await crypto.subtle.importKey(
    "raw",
    encodedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  console.log("解密后的文本：", 2);

  const iv = new Uint8Array(
    hash.iv.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  console.log("解密后的文本：", 3);
  const encryptedData = new Uint8Array(
    hash.content.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
  console.log("解密后的文本：", 4);

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );
  console.log("解密后的文本：", 5);

  return dec.decode(decryptedData);
};

(async () => {
  console.log("start!!");
  // 测试数据
  const secretKey = "my-secret-key";
  const originalText = "Hello, world!";

  try {
    // 加密
    const encryptedData = await encryptData(originalText, secretKey);
    console.log("加密后的数据：", encryptedData);

    // 解密
    const decryptedText = await decryptData(encryptedData, secretKey);
    console.log("解密后的文本：", decryptedText);

    // 验证是否与原始文本一致
    if (decryptedText === originalText) {
      console.log("解密成功！");
    } else {
      console.log("解密失败！");
    }
  } catch (error) {
    console.log("error", error);
  }
})();

export default encrypt;
