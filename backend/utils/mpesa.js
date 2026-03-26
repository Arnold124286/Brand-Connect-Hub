const axios = require('axios');

const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET missing in .env');
  }

  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('[Mpesa] Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token. Verify Consumer Key/Secret.');
  }
};

const initiateSTKPush = async (amount, phoneNumber) => {
  const token = await getAccessToken();
  const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  
  const shortCode = process.env.MPESA_SHORTCODE || '174379';
  const passkey = process.env.MPESA_PASSKEY;
  
  if (!passkey) throw new Error('MPESA_PASSKEY missing in .env');

  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  const data = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: 'BrandConnect',
    TransactionDesc: 'Wallet Funding',
  };

  try {
    const response = await axios.post(url, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('[Mpesa] STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate STK Push');
  }
};

module.exports = { initiateSTKPush };
