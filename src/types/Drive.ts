import { Timestamp } from 'firebase/firestore';

export type Drive = {
  id: string;
  title: string;
  description: string;
  eligibility: string;
  postedBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: string;
  location?: string;
  applicationDeadline?: Timestamp;
  salaryPackage?: string | number;
  jobType?: string;
  companyName: string;
  pdfUrl?: string;
  applicantsCount?: number;
  createdBy?: string; // Added to track who created the drive
};
