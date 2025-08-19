const pmlib = require("./sign-util-lib");

// Fields not participating in signature
const excludeFields = [
  "sign",
  "sign_type",
  "header",
  "refund_info",
  "openType",
  "raw_request",
  "biz_content",
];

export function signRequestObject(requestObject: Record<string, any>) {
  let fields = [];
  let fieldMap: any = {};
  for (let key in requestObject) {
    if (excludeFields.indexOf(key) >= 0) {
      continue;
    }
    fields.push(key);
    fieldMap[key] = requestObject[key];
  }
  // the fields in "biz_content" must Participating signature
  if (requestObject.biz_content) {
    let biz = requestObject.biz_content;
    for (let key in biz) {
      if (excludeFields.indexOf(key) >= 0) {
        continue;
      }
      fields.push(key);
      fieldMap[key] = biz[key];
    }
  }
  // sort by ascii
  fields.sort();

  let signStrList = [];
  for (let i = 0; i < fields.length; i++) {
    let key = fields[i];
    signStrList.push(key + "=" + fieldMap[key]);
  }
  let signOriginStr = signStrList.join("&");
  //("signOriginStr", signOriginStr);
  return signString(signOriginStr, process.env.EXPO_PUBLIC_PRIVATEKEY!);
}

let signString = (text: string, privateKey: string) => {
  const sha256withrsa = new pmlib.rs.KJUR.crypto.Signature({
    alg: "SHA256withRSAandMGF1",
  });
  sha256withrsa.init(privateKey);
  sha256withrsa.updateString(text);
  const sign = pmlib.rs.hextob64(sha256withrsa.sign());
  return sign;
};

export function createTimeStamp() {
  return Math.round(new Date().getTime() / 1000) + "";
}

// create a 32 length random string
export function createNonceStr() {
  let chars = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
  let str = "";
  for (let i = 0; i < 32; i++) {
    let index = parseInt((Math.random() * 35).toString());
    str += chars[index];
  }
  return str;
}
