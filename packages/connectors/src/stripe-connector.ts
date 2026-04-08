import { BaseConnector, ConnectorConfig, SyncResult } from './base-connector';

export interface StripeConfig extends ConnectorConfig {
  secretKey: string;
  webhookSecret?: string;
}

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  created: number;
  balance: number;
  currency?: string;
  default_source?: string;
  delinquent?: boolean;
  metadata?: Record<string, string>;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  created: number;
  due_date?: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void_invoice';
  subscription?: string;
  lines?: {
    data: Array<{
      id: string;
      description?: string;
      amount: number;
      quantity?: number;
    }>;
  };
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'trialing';
  created: number;
  current_period_start: number;
  current_period_end: number;
  plan?: {
    id: string;
    name?: string;
    amount: number;
    currency: string;
    interval: 'day' | 'week' | 'month' | 'year';
  };
  items?: {
    data: Array<{
      id: string;
      quantity: number;
      price?: {
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

export interface StripePaymentIntent {
  id: string;
  customer?: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'succeeded' | 'canceled';
  created: number;
  description?: string;
  invoice?: string;
  metadata?: Record<string, string>;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  customer?: string;
  status: 'succeeded' | 'pending' | 'failed';
  paid: boolean;
  refunded: boolean;
  amount_refunded?: number;
  failure_code?: string;
  failure_message?: string;
  created: number;
  invoice?: string;
  payment_intent?: string;
}

export class StripeConnector extends BaseConnector<StripeConfig> {
  protected readonly name = 'stripe';
  private apiUrl = 'https://api.stripe.com/v1';

  async connect(config: StripeConfig): Promise<void> {
    this.config = config;
    this.isConnected = true;
    
    console.log('[Stripe] Connected to Stripe API');
  }

  async syncCustomers(since?: Date): Promise<SyncResult<StripeCustomer>> {
    if (!this.isConnected) {
      throw new Error('Stripe connector not connected');
    }

    try {
      const params = new URLSearchParams({ limit: '100' });
      
      if (since) {
        params.append('created[gt]', String(Math.floor(since.getTime() / 1000)));
      }

      const response = await this.fetch(`/customers?${params.toString()}`);
      const customers = response.data as StripeCustomer[];

      return {
        success: true,
        data: customers,
        count: customers.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Customer',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncInvoices(since?: Date): Promise<SyncResult<StripeInvoice>> {
    if (!this.isConnected) {
      throw new Error('Stripe connector not connected');
    }

    try {
      const params = new URLSearchParams({ 
        limit: '100',
        expand: ['data.lines'],
      });
      
      if (since) {
        params.append('created[gt]', String(Math.floor(since.getTime() / 1000)));
      }

      const response = await this.fetch(`/invoices?${params.toString()}`);
      const invoices = response.data as StripeInvoice[];

      return {
        success: true,
        data: invoices,
        count: invoices.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Invoice',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncSubscriptions(since?: Date): Promise<SyncResult<StripeSubscription>> {
    if (!this.isConnected) {
      throw new Error('Stripe connector not connected');
    }

    try {
      const params = new URLSearchParams({ 
        limit: '100',
        status: 'all',
      });
      
      if (since) {
        params.append('created[gt]', String(Math.floor(since.getTime() / 1000)));
      }

      const response = await this.fetch(`/subscriptions?${params.toString()}`);
      const subscriptions = response.data as StripeSubscription[];

      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Subscription',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncPaymentIntents(since?: Date): Promise<SyncResult<StripePaymentIntent>> {
    if (!this.isConnected) {
      throw new Error('Stripe connector not connected');
    }

    try {
      const params = new URLSearchParams({ limit: '100' });
      
      if (since) {
        params.append('created[gt]', String(Math.floor(since.getTime() / 1000)));
      }

      const response = await this.fetch(`/payment_intents?${params.toString()}`);
      const paymentIntents = response.data as StripePaymentIntent[];

      return {
        success: true,
        data: paymentIntents,
        count: paymentIntents.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'PaymentIntent',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncCharges(since?: Date): Promise<SyncResult<StripeCharge>> {
    if (!this.isConnected) {
      throw new Error('Stripe connector not connected');
    }

    try {
      const params = new URLSearchParams({ limit: '100' });
      
      if (since) {
        params.append('created[gt]', String(Math.floor(since.getTime() / 1000)));
      }

      const response = await this.fetch(`/charges?${params.toString()}`);
      const charges = response.data as StripeCharge[];

      return {
        success: true,
        data: charges,
        count: charges.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Charge',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async getCustomerRevenue(customerId: string): Promise<{
    totalRevenue: number;
    invoiceCount: number;
    lastPaymentDate?: Date;
  }> {
    const invoicesResult = await this.syncInvoices();
    
    if (!invoicesResult.success) {
      throw new Error('Failed to fetch invoices');
    }

    const customerInvoices = invoicesResult.data.filter(inv => inv.customer === customerId);
    const totalRevenue = customerInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount_paid, 0);

    const paidInvoices = customerInvoices.filter(inv => inv.status === 'paid');
    const lastPaymentDate = paidInvoices.length > 0
      ? new Date(Math.max(...paidInvoices.map(inv => inv.created)) * 1000)
      : undefined;

    return {
      totalRevenue,
      invoiceCount: paidInvoices.length,
      lastPaymentDate,
    };
  }

  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>,
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      
      if (name) {
        formData.append('name', name);
      }

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          formData.append(`metadata[${key}]`, value);
        });
      }

      const response = await this.post('/customers', formData);
      
      return {
        success: true,
        customerId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createInvoice(
    customerId: string,
    items: Array<{ description: string; amount: number; quantity?: number }>,
    dueDate?: Date,
  ): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      const formData = new URLSearchParams();
      formData.append('customer', customerId);
      
      if (dueDate) {
        formData.append('due_date', String(Math.floor(dueDate.getTime() / 1000)));
      }

      // Create invoice first
      const invoiceResponse = await this.post('/invoices', formData);
      const invoiceId = invoiceResponse.id;

      // Add line items
      for (const item of items) {
        const itemData = new URLSearchParams();
        itemData.append('invoice', invoiceId);
        itemData.append('description', item.description);
        itemData.append('amount', String(item.amount));
        
        if (item.quantity) {
          itemData.append('quantity', String(item.quantity));
        }

        await this.post('/invoiceitems', itemData);
      }

      // Finalize invoice
      await this.post(`/invoices/${invoiceId}/finalize`, new URLSearchParams());

      return {
        success: true,
        invoiceId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.post(`/subscriptions/${subscriptionId}/cancel`, new URLSearchParams());
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetch(path: string): Promise<any> {
    const url = `${this.apiUrl}${path}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config!.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private async post(path: string, formData: URLSearchParams): Promise<any> {
    const url = `${this.apiUrl}${path}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }
}
