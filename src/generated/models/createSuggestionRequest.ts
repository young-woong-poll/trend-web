export interface CreateSuggestionRequest {
  /**
   * @minLength 0
   * @maxLength 100
   */
  title: string;
  /**
   * @minItems 2
   * @maxItems 4
   */
  items: string[];
  categoryIds: number[];
}
