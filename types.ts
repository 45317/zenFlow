
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
}

export type AppLanguage = 
  | 'en' | 'es' | 'fr' | 'de' | 'jp' | 'ar' | 'zh' | 'hi' | 'pt' | 'ru' 
  | 'it' | 'ko' | 'tr' | 'nl' | 'pl' | 'sv' | 'id' | 'vi' | 'th' | 'he'
  | 'el' | 'cs' | 'da' | 'fi' | 'no' | 'hu' | 'ro' | 'bn' | 'pa' | 'jv'
  | 'te' | 'mr' | 'ta' | 'ur' | 'gu' | 'kn' | 'ml' | 'uk' | 'fa' | 'ms'
  | 'uz' | 'ro' | 'az' | 'hr' | 'sk' | 'sl' | 'et' | 'lv' | 'lt' | 'sq';

export type AppTheme = 'light' | 'dark';

export type ProductivityState = {
  todos: Todo[];
  notes: Note[];
  events: CalendarEvent[];
  language?: AppLanguage;
  theme?: AppTheme;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};
