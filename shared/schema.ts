import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// App-specific schemas

export const functionSchema = z.object({
  name: z.string(),
  params: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
  })),
  returnType: z.string().optional(),
  fileName: z.string(),
  code: z.string(),
  complexity: z.number().optional(),
});

export type FunctionInfo = z.infer<typeof functionSchema>;

export const specificationSchema = z.object({
  description: z.string(),
  mappedFunction: z.string().optional(),
  confidence: z.number().optional(),
});

export type Specification = z.infer<typeof specificationSchema>;

export const testTypeSchema = z.object({
  whitebox: z.object({
    statement: z.boolean(),
    branch: z.boolean(),
    path: z.boolean(),
  }),
  blackbox: z.object({
    boundary: z.boolean(),
    equivalence: z.boolean(),
  }),
});

export type TestTypes = z.infer<typeof testTypeSchema>;

export const testStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed"
]);

export type TestStatus = z.infer<typeof testStatusSchema>;

export const testCategorySchema = z.enum([
  "whitebox_statement",
  "whitebox_branch",
  "whitebox_path",
  "blackbox_boundary",
  "blackbox_equivalence"
]);

export type TestCategory = z.infer<typeof testCategorySchema>;

export const testResultSchema = z.object({
  category: testCategorySchema,
  count: z.number(),
  status: testStatusSchema,
});

export type TestResult = z.infer<typeof testResultSchema>;

export const functionTestSchema = z.object({
  functionName: z.string(),
  fileName: z.string(),
  status: testStatusSchema,
  results: z.array(testResultSchema),
});

export type FunctionTest = z.infer<typeof functionTestSchema>;

export const testFileSchema = z.object({
  name: z.string(),
  content: z.string(),
  functionName: z.string(),
  testCount: z.number(),
  categories: z.array(testCategorySchema),
});

export type TestFile = z.infer<typeof testFileSchema>;

export const cicdFileSchema = z.object({
  name: z.string(),
  content: z.string(),
  fileType: z.enum(["package_json", "github_workflow"]),
});

export type CICDFile = z.infer<typeof cicdFileSchema>;
