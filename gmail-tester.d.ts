declare module "gmail-tester" {
  
  export interface Attachment {
    filename: string;
    data: string;
    mimeType: string;
  }
  
  export interface Email {
    from: string;
    receiver: string;
    subject: string;
    cc?: string;
    date: Date;
    body?: {
      html: string;
      text: string;
    };
    attachments?: Attachment[];
  }

  export interface CheckInboxOptions {
    include_body?: boolean;
    from?: string;
    to?: string;
    subject?: string;
    before?: Date;
    after?: Date;
    wait_time_sec?: number;
    max_wait_time_sec?: number;
    label?: string;
    include_attachments?: boolean;
  }

  export interface GetMessagesOptions {
    include_body?: boolean;
    from?: string;
    to?: string;
    subject?: string;
    before?: Date;
    after?: Date;
    label?: string;
    include_attachments?: boolean;
  }

  export interface OAuthClientKeys {
    client_id: string,
    project_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret: string,
    redirect_uris: string[]
  }

  /** A Desktop app client ("installed") or a Web application client ("web"). */
  export type Credentials =
    | { installed: OAuthClientKeys }
    | { web: OAuthClientKeys };

  export function check_inbox(
    credentials: string | Credentials,
    token: string | Record<string, unknown>,
    options: CheckInboxOptions,
    port?: number
  ): Promise<Email[]>;

  export function get_messages(
    credentials: string | Credentials,
    token: string | Record<string, unknown>,
    options: GetMessagesOptions,
    port?: number
  ): Promise<Email[]>;

  export function refresh_access_token(
    credentials: string | Credentials,
    token: string | Record<string, unknown>,
    port?: number
  ): Promise<void>;
}
