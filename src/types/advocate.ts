export interface Advocate {
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number | string;
  id?: string;
}

export type UseAdvocatesResult = {
  data: Advocate[] | null;
  isLoading: boolean;
  error: Error | null;

};