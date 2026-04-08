import { Connector, SyncResult, Entity } from '@strata/shared';

export interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    description?: any;
    status?: { name?: string };
    priority?: { name?: string };
    assignee?: { emailAddress?: string; displayName?: string };
    reporter?: { emailAddress?: string; displayName?: string };
    created?: string;
    updated?: string;
    duedate?: string;
    issuetype?: { name?: string; iconUrl?: string };
    project?: { key?: string; name?: string };
  };
}

export class JiraConnector implements Connector {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}/rest/api/3`;
    this.authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;
  }

  async sync(): Promise<SyncResult> {
    const results = await Promise.all([
      this.syncIssues(),
      this.syncSprints(),
    ]);

    return {
      entities: results.flatMap(r => r.entities),
      events: results.flatMap(r => r.events),
      errors: results.flatMap(r => r.errors),
    };
  }

  private async syncIssues(): Promise<SyncResult> {
    try {
      // In production: fetch from Jira API
      // GET /rest/api/3/search?jql=updated>=-7d
      const issues: JiraIssue[] = [];

      const entities: Entity[] = issues.map(issue => ({
        id: `jira_issue_${issue.id}`,
        type: 'task',
        source: 'jira',
        data: {
          key: issue.key,
          summary: issue.fields.summary,
          description: typeof issue.fields.description === 'string' 
            ? issue.fields.description 
            : (issue.fields.description as any)?.content,
          status: issue.fields.status?.name,
          priority: issue.fields.priority?.name,
          assignee: issue.fields.assignee?.displayName,
          assigneeEmail: issue.fields.assignee?.emailAddress,
          reporter: issue.fields.reporter?.displayName,
          dueDate: issue.fields.duedate,
          issueType: issue.fields.issuetype?.name,
          project: issue.fields.project?.name,
          projectKey: issue.fields.project?.key,
        },
        timestamp: issue.fields.updated || issue.fields.created || new Date().toISOString(),
      }));

      return { entities, events: [], errors: [] };
    } catch (error) {
      return {
        entities: [],
        events: [],
        errors: [{ source: 'jira', message: 'Failed to sync issues', error: String(error) }],
      };
    }
  }

  private async syncSprints(): Promise<SyncResult> {
    try {
      // In production: fetch active sprints from boards
      const sprints: any[] = [];

      const entities: Entity[] = sprints.map(sprint => ({
        id: `jira_sprint_${sprint.id}`,
        type: 'sprint',
        source: 'jira',
        data: {
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal,
        },
        timestamp: new Date().toISOString(),
      }));

      return { entities, events: [], errors: [] };
    } catch (error) {
      return {
        entities: [],
        events: [],
        errors: [{ source: 'jira', message: 'Failed to sync sprints', error: String(error) }],
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // In production: make actual API call to Jira
      // GET /rest/api/3/myself
      return true;
    } catch {
      return false;
    }
  }
}
