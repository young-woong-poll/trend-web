export interface ResultData {
  questionId: string;
  question: string;
  selectedOption: string;
  totalVotes: number;
  optionPercentages: {
    id: string;
    text: string;
    percentage: number;
    count: number;
  }[];
}

export interface SurveyResult {
  surveyId: string;
  type: string;
  title: string;
  results: ResultData[];
  completedAt: Date;
}
