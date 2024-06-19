import crypto, { createHash } from "crypto";

const encryp = (algorithm: string, content: string) => {
  let hash = createHash(algorithm);
  hash.update(content);
  return hash.digest("hex");
};

const sha1 = (content: string) => {
  return encryp("sha1", content);
};

const encrypt = (str: string) => {
  return sha1(sha1(str));
};

const algorithm = "aes-256-ctr";
const iv = crypto.randomBytes(16);

export const encryptData = (text: string, secretKey: string) => {
  const key = crypto.scryptSync(String(secretKey), "salt", 32);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  };
};

export const decryptData = (
  hash: { iv: string; content: string },
  secretKey: string
) => {
  const key = crypto.scryptSync(String(secretKey), "salt", 32);
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(hash.iv, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
};

export default encrypt;
