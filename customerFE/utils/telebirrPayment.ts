import axios from "axios";
import { createNonceStr, createTimeStamp, signRequestObject } from "./tools";
async function applyFabricToken() {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_TELEBIRR_API}/payment/v1/token`,
      {
        appSecret: process.env.EXPO_PUBLIC_TELEBIRR_APPSECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": process.env.EXPO_PUBLIC_FABRIC_ID,
        },
      }
    );

    // Assuming your response is a JSON object, no need to parse it
    return response.data;
  } catch (error) {
    console.error("Error while applying fabric token:", error);
    throw error; // Propagate the error for handling at a higher level
  }
}

export const createOrder = async (title: string, amount: string) => {
  let applyFabricTokenResult = await applyFabricToken();
  let fabricToken = applyFabricTokenResult.token;
  let createOrderResult = await requestCreateOrder(fabricToken, title, amount);
  //(createOrderResult);
  let prepayId = createOrderResult.biz_content.prepay_id;
  let rawRequest = createRawRequest(prepayId);
  //("RAW_REQ: ", rawRequest);
  return rawRequest;
};

const requestCreateOrder = async (
  fabricToken: string,
  title: string,
  amount: string
) => {
  try {
    const reqObject = createRequestObject(title, amount);
    //(reqObject);

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_TELEBIRR_API}/payment/v1/inapp/createOrder`,
      reqObject,
      {
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": process.env.EXPO_PUBLIC_FABRIC_ID,
          Authorization: fabricToken,
        },
      }
    );

    // Assuming your response is a JSON object, no need to parse it
    return response.data;
  } catch (error) {
    console.error("Error while requesting create order:", error);
    throw error; // Propagate the error for handling at a higher level
  }
};

function createRequestObject(title: string, amount: string) {
  let req: Record<string, any> = {
    timestamp: createTimeStamp(),
    nonce_str: createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };
  let biz = {
    // notify_url: "https://node-api-muxu.onrender.com/api/v1/notify",
    trade_type: "InApp",
    appid: process.env.EXPO_PUBLIC_MERCHANT_APPID,
    merch_code: process.env.EXPO_PUBLIC_MERCHANT_SHORTCODE,
    merch_order_id: createMerchantOrderId(),
    title: title,
    total_amount: amount,
    trans_currency: "ETB",
    timeout_express: "120m",
    payee_identifier: process.env.EXPO_PUBLIC_MERCHANT_SHORTCODE,
    payee_identifier_type: "04",
    payee_type: "5000",
    // redirect_url: "https://216.24.57.253/api/v1/notify",
  };
  req.biz_content = biz;
  req.sign = signRequestObject(req);
  req.sign_type = "SHA256WithRSA";
  //(req);
  return req;
}

function createMerchantOrderId() {
  return new Date().getTime() + "";
}

function createRawRequest(prepayId: string) {
  let map = {
    appid: process.env.EXPO_PUBLIC_MERCHANT_APPID,
    merch_code: process.env.EXPO_PUBLIC_MERCHANT_SHORTCODE,
    nonce_str: createNonceStr(),
    prepay_id: prepayId,
    timestamp: createTimeStamp(),
  };
  let sign = signRequestObject(map);
  // order by ascii in array
  let rawRequest = [
    "appid=" + map.appid,
    "merch_code=" + map.merch_code,
    "nonce_str=" + map.nonce_str,
    "prepay_id=" + map.prepay_id,
    "timestamp=" + map.timestamp,
    "sign=" + sign,
    "sign_type=SHA256WithRSA",
  ].join("&");
  //("rawRequest = ", rawRequest);
  return rawRequest;
}
