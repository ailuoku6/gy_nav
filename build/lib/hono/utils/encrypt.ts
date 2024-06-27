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

const iv = new Uint8Array([21, 34, 56, 78, 90, 12, 43, 56, 78, 90, 11, 22]);

async function convertKeyToFixedBits(secretKey: string) {
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(secretKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

  // const iv = crypto.getRandomValues(new Uint8Array(12));
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
  // const encodedKey = enc.encode(secretKey);
  const encodedKey = enc.encode(await convertKeyToFixedBits(secretKey));
  const key = await crypto.subtle.importKey(
    "raw",
    encodedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const iv = new Uint8Array(
    (hash.iv.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
  );
  const encryptedData = new Uint8Array(
    (hash.content.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );

  return dec.decode(decryptedData);
};

export default encrypt;
