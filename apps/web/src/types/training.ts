export type DegreeType = "ENGINEER" | "BACHELOR";
export type EducationLevel = "UNDERGRADUATE";
export type ProgramStatus = "PUBLISHED" | "DRAFT";

export interface TrainingProgram {
  id: string;
  code: string;
  name: string;
  slug: string;
  degreeType: DegreeType;
  educationLevel: EducationLevel;
  description?: string | null;
  curriculumContent?: string | null;
  attachmentUrl?: string | null;
  originalAttachmentUrl?: string | null;
  status: ProgramStatus;
  displayOrder: number;
  duration?: string;
  faculty?: string;
  specializations?: string[];
  careerOpportunities?: string[];
}

export type DegreeFilterType = "ALL" | "ENGINEER" | "BACHELOR";
