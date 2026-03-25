export interface IApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  spaceId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface IApiKeyInput {
  name: string;
  scopes: string[];
  spaceId?: string;
  expiresAt?: string;
}

export interface IApiKeyValidationInput {
  key: string;
}

export interface IApiKeyValidationResult {
  valid: boolean;
  scopes: string[];
  spaceId?: string;
  expiresAt?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
}
