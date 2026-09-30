import { model, Schema } from 'mongoose';

const studentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phoneNumber: { type: String, trim: true, maxlength: 30, default: null },
    institution: { type: String, trim: true, maxlength: 160, default: null },
    department: { type: String, trim: true, maxlength: 160, default: null },
    fieldOfStudy: { type: String, trim: true, maxlength: 160, default: null },
    currentLevel: { type: String, trim: true, maxlength: 40, default: null },
    expectedDurationWeeks: { type: Number, min: 1, max: 104, default: null },
    preferredLocations: { type: [String], default: [] },
    skills: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Index to ensure that each user can have only one student profile
studentSchema.index({ userId: 1 }, { unique: true });

// StudentProfileInput interface defines the structure of the student profile data
// that can be provided when creating or updating a student profile.
export interface StudentProfileInput {
  fullName: string;
  phoneNumber?: string;
  institution?: string;
  department?: string;
  fieldOfStudy?: string;
  currentLevel?: string;
  expectedDurationWeeks?: number;
  preferredLocations?: string[];
  skills?: string[];
}

export const Student = model('Student', studentSchema); // Export the Student model for use in other parts of the application

export type StudentId = Schema.Types.ObjectId; // Type alias for the type of the _id field in the Student model
