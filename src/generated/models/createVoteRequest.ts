import type { JsonNode } from './jsonNode';

export interface CreateVoteRequest {
  electionItemId: number;
  clientMeta?: JsonNode;
}
