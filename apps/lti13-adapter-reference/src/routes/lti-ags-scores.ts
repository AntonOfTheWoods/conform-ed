import { LtiAgsV2_0 } from "@conform-ed/contracts";

export function agsScoresRoute(): Response {
  return Response.json({
    operation: "lti.ags.scores",
    score: LtiAgsV2_0.ScoreSchema.parse({
      userId: "student-123",
      scoreGiven: 85,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
      timestamp: "2026-05-28T09:41:32.407Z",
    }),
  });
}
