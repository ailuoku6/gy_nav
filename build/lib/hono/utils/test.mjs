import crypto, { createHash } from "crypto";
import { encryptData, decryptData } from "./encrypt";

const encryp = (algorithm, content) => {
  let hash = createHash(algorithm);
  hash.update(content);
  return hash.digest("hex");
};

const sha1 = (content) => {
  return encryp("sha1", content);
};

const encrypt = (str) => {
  return sha1(sha1(str));
};

console.info("--------", encrypt("test123fgy"));

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
