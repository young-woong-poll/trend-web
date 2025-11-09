export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export type SurveyType = 'relationship' | 'lifestyle' | 'work' | 'hobby';

export interface PageParams {
  type: string;
}
