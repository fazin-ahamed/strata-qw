// Connector framework for Strata platform

export * from './base-connector';
export * from './gmail-connector';
export * from './zoom-connector';

import { ConnectorConfig } from './base-connector';
import { GmailConnector } from './gmail-connector';
import { ZoomConnector } from './zoom-connector';
import { CalendarConnector, EmailConnector, CRMConnector, BankingConnector } from './index';

export class ConnectorFactory {
  static create(config: ConnectorConfig) {
    switch (config.provider) {
      case 'gmail':
        return new GmailConnector(config);
      case 'zoom':
        return new ZoomConnector(config);
      // Add more providers as implemented
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
