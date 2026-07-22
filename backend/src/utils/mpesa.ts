import axios from 'axios';
import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

const SAFARICOM_IPS = [
  '196.201.214.200', '196.201.214.206', '196.201.213.114',
  '196.201.214.207', '196.201.214.208', '196.201.213.44',
  '196.201.212.127', '196.201.212.138', '196.201.212.129',
  '196.201.212.136', '196.201.212.74', '196.201.212.69',
];

export class MpesaService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private passkey: string;
  private shortcode: string;
  private callbackSecret: string;
  private callbackUrl: string;

  constructor() {
    const env = process.env.MPESA_ENV || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '174379';
    this.callbackSecret = process.env.MPESA_CALLBACK_SECRET_KEY || '';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || '';
  }

  async getAccessToken(): Promise<string> {
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    });

    return response.data.access_token;
  }

  generatePassword(timestamp: string): string {
    const password = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(password).toString('base64');
  }

  getTimestamp(): string {
    const date = new Date();
    return date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');
  }

  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    }
    return cleaned;
  }

  async initiateSTKPush(
    userId: string,
    phoneNumber: string,
    amount: number,
    description: string = 'Wallet Deposit'
  ) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Create pending transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        type: TransactionType.DEPOSIT,
        amount,
        status: TransactionStatus.PENDING,
        phoneNumber: formattedPhone,
        description,
      },
    });

    const callbackUrl = `${this.callbackUrl}?secret=${this.callbackSecret}&txId=${transaction.id}`;

    const stkData = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'WalkToEarn',
      TransactionDesc: description,
    };

    const response = await axios.post(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Update transaction with M-Pesa request IDs
    await prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: {
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
      },
    });

    return {
      transactionId: transaction.id,
      merchantRequestId: response.data.MerchantRequestID,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseDescription: response.data.ResponseDescription,
    };
  }

  validateCallbackSource(clientIp: string): boolean {
    if (process.env.NODE_ENV === 'development') return true;
    return SAFARICOM_IPS.includes(clientIp);
  }

  validateCallbackSecret(secret: string): boolean {
    return secret === this.callbackSecret;
  }

  async processCallback(
    transactionId: string,
    callbackData: any
  ) {
    const stkCallback = callbackData.Body?.stkCallback;

    if (!stkCallback) {
      throw new Error('Invalid callback data structure');
    }

    const { ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    const isSuccess = ResultCode === 0;

    const updateData: any = {
      status: isSuccess ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
      metadata: {
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        rawCallback: callbackData,
      },
    };

    if (isSuccess && CallbackMetadata?.Item) {
      const items = CallbackMetadata.Item;
      const receipt = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const amount = items.find((item: any) => item.Name === 'Amount');
      const phone = items.find((item: any) => item.Name === 'PhoneNumber');
      const date = items.find((item: any) => item.Name === 'TransactionDate');

      if (receipt) updateData.mpesaReceipt = String(receipt.Value);
      if (amount) updateData.amount = amount.Value;
      if (phone) updateData.phoneNumber = String(phone.Value);
      if (date) updateData.metadata.transactionDate = date.Value;
    }

    // Update transaction
    const transaction = await prisma.walletTransaction.update({
      where: { id: transactionId },
      data: updateData,
      include: { user: true },
    });

    // If successful, update user wallet
    if (isSuccess) {
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          walletBalance: { increment: transaction.amount },
          totalDeposited: { increment: transaction.amount },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: 'Deposit Successful',
          body: `KES ${transaction.amount} has been added to your wallet. Receipt: ${updateData.mpesaReceipt || 'N/A'}`,
          type: 'TRANSACTION',
          data: { transactionId: transaction.id, amount: transaction.amount.toNumber() },
        },
      });
    } else {
      // Create failure notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: 'Deposit Failed',
          body: `Your deposit of KES ${transaction.amount} failed: ${ResultDesc}`,
          type: 'TRANSACTION',
          data: { transactionId: transaction.id, reason: ResultDesc },
        },
      });
    }

    return { success: isSuccess, transaction };
  }

  async queryTransactionStatus(checkoutRequestId: string) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    const response = await axios.post(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
}

export const mpesaService = new MpesaService();
