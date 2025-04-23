import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema remains from the original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// New schemas for the test generation application
export const codeFiles = pgTable("code_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'js', 'ts', 'jsx', 'tsx', 'md'
  size: integer("size").notNull(),
  isSpecFile: boolean("is_spec_file").notNull().default(false),
  uploaded_at: text("uploaded_at").notNull(), // ISO date string
});

export const insertCodeFileSchema = createInsertSchema(codeFiles).omit({
  id: true
});

export const functions = pgTable("functions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  params: jsonb("params").notNull(), // Array of parameter names
  returnType: text("return_type"),
  fileId: integer("file_id").notNull(), // Foreign key to code_files
  hasSpec: boolean("has_spec").notNull().default(false),
});

export const insertFunctionSchema = createInsertSchema(functions).omit({
  id: true
});

export const testFiles = pgTable("test_files", {
  id: serial("id").primaryKey(),
  functionId: integer("function_id").notNull(), // Foreign key to functions
  testCode: text("test_code").notNull(),
  testFileName: text("test_file_name").notNull(),
  testCount: integer("test_count").notNull(),
  testTypes: jsonb("test_types").notNull(), // Array of test types (e.g., 'whitebox', 'blackbox')
  coverage: jsonb("coverage"), // Coverage metrics
  generated_at: text("generated_at").notNull(), // ISO date string
});

export const insertTestFileSchema = createInsertSchema(testFiles).omit({
  id: true
});

// Types for the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CodeFile = typeof codeFiles.$inferSelect;
export type InsertCodeFile = z.infer<typeof insertCodeFileSchema>;

export type Function = typeof functions.$inferSelect;
export type InsertFunction = z.infer<typeof insertFunctionSchema>;

// Sessions table for saving and loading test generation sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  files: jsonb("files").notNull(), // Array of UploadedFile objects
  extractedFunctions: jsonb("extracted_functions"), // Array of ExtractedFunction objects
  generatedTests: jsonb("generated_tests"), // Array of GeneratedTest objects
  stats: jsonb("stats"), // Additional statistics about the session
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export type TestFile = typeof testFiles.$inferSelect;
export type InsertTestFile = z.infer<typeof insertTestFileSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
