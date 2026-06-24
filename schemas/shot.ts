import { z } from "zod";

export const SessionMetaSchema = z.object({
  date:  z.string().default(""),
  place: z.string().default(""),
});

// All numeric fields default to 0 so parsers for other formats only need to
// provide the fields they have — the schema fills in the rest.
export const ShotSchema = z.object({
  club:             z.string().min(1),
  index:            z.number().default(0),
  ballSpeed:        z.number().default(0),
  launchDirection:  z.number().default(0),
  launchAngle:      z.number().default(0),
  spinRate:         z.number().default(0),
  spinAxis:         z.number().default(0),
  backSpin:         z.number().default(0),
  sideSpin:         z.number().default(0),
  apex:             z.number().default(0),
  carry:            z.number().default(0),
  total:            z.number().default(0),
  offline:          z.number().default(0),
  landingAngle:     z.number().default(0),
  clubPath:         z.number().default(0),
  faceAngle:        z.number().default(0),
  attackAngle:      z.number().default(0),
  dynamicLoft:      z.number().default(0),
  impactHorizontal: z.number().default(0),
  impactVertical:   z.number().default(0),
  clubSpeed:        z.number().default(0),
  smashFactor:      z.number().default(0),
});

export const ParsedSessionSchema = z.object({
  meta:  SessionMetaSchema,
  shots: z.array(ShotSchema).min(1, "No shots found in file"),
});

export type Shot         = z.infer<typeof ShotSchema>;
export type SessionMeta  = z.infer<typeof SessionMetaSchema>;
export type ParsedSession = z.infer<typeof ParsedSessionSchema>;
