// Connector framework for Strata platform

export * from './base-connector';
export * from './gmail-connector';
export * from './zoom-connector';
export * from './salesforce-connector';
export * from './slack-connector';
export * from './stripe-connector';

import { GmailConnector } from './gmail-connector';
import { ZoomConnector } from './zoom-connector';
import { SalesforceConnector } from './salesforce-connector';
import { SlackConnector } from './slack-connector';
import { StripeConnector } from './stripe-connector';
import { ConnectorConfig } from './base-connector';

export const Connectors = {
  Gmail: GmailConnector,
  Zoom: ZoomConnector,
  Salesforce: SalesforceConnector,
  Slack: SlackConnector,
  Stripe: StripeConnector,
};

export class ConnectorFactory {
  static create(config: ConnectorConfig) {
    switch (config.provider) {
      case 'gmail':
        return new GmailConnector();
      case 'zoom':
        return new ZoomConnector();
      case 'salesforce':
        return new SalesforceConnector();
      case 'slack':
        return new SlackConnector();
      case 'stripe':
        return new StripeConnector();
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
